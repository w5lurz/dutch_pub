// "Forgot password?": the app asks for a link (`POST /api/auth/forgot-password`), the email
// brings the user to a web page on this server (`/reset-password?token=...`) where they choose
// a new password. A web page, not the app: it works on whatever device reads the email.
//
// Needs PUBLIC_URL (the server's address as the phones reach it, e.g. https://dutchpub.example)
// and a way to send mail (mail.js). The link is built from PUBLIC_URL, never from the request's
// Host header: a forged header would otherwise send someone's reset link to another site.
//
// Language: the app sends its own; the email is in it and the link carries it (`&lang=`) to the
// page, which otherwise follows the browser's language (texts.js).

import bcrypt from 'bcryptjs';
import express, { Router } from 'express';
import { emailError, PASSWORD_MIN, passwordError } from '@dutch-pub/shared';

import { PASSWORD_ROUNDS } from './account.js';
import { mailConfigured, sendMail } from './mail.js';
import { hashToken, newRefreshToken } from './middleware/authJwt.js';
import db from './models/index.js';
import { escapeHtml, page } from './pages.js';
import { limiter, rateLimit, TOO_MANY } from './rateLimit.js';
import { languageOf, languageOfRequest, text } from './texts.js';
import { serverError } from './utils/utils.js';

const User = db.user;
const PasswordReset = db.password_reset;

/** How long a link works. */
const RESET_MINUTES = Number(process.env.PASSWORD_RESET_MINUTES ?? 60);
const HOUR = 60 * 60 * 1000;

/** Whether password reset is set up on this server. */
export const resetAvailable = () => mailConfigured() && Boolean(process.env.PUBLIC_URL);

const resetLink = (token, language) =>
    `${process.env.PUBLIC_URL.replace(/\/+$/, '')}/reset-password?token=${encodeURIComponent(token)}${language === 'en' ? '' : `&lang=${language}`}`;

// At most 3 emails per address per hour (nobody's inbox gets flooded), and some per phone.
const mailsPerEmail = limiter({ windowMs: HOUR, max: 3 });
const requestsPerAddress = rateLimit({ windowMs: HOUR, max: 10 });
const resetsPerAddress = limiter({ windowMs: 15 * 60 * 1000, max: 20 });

// The API's answer stays English (the app translates it).
const SENT = `If an account uses this email, a link to set a new password is on its way. It works for ${RESET_MINUTES} minutes.`;

/** The reset row of a link's token, if it is known and not expired. */
const validReset = async token => {
    if (typeof token !== 'string' || !token || token.length > 200) return null;
    const reset = await PasswordReset.findOne({ where: { token_hash: hashToken(token) } });
    return reset && reset.expires_at > new Date() ? reset : null;
};

const mailFor = (username, link, language) => {
    const t = (key, params) => text(language, key, params);
    return {
        subject: t('mailSubject'),
        text: `${t('mailGreeting', { name: username })}\n\n${t('mailIntro', { minutes: RESET_MINUTES })}\n\n${link}\n\n${t('mailIgnore')}\n`,
        html: `<p>${escapeHtml(t('mailGreeting', { name: username }))}</p>
<p>${escapeHtml(t('mailIntro', { minutes: RESET_MINUTES }))}</p>
<p><a href="${escapeHtml(link)}">${escapeHtml(t('mailButton'))}</a></p>
<p>${escapeHtml(t('mailIgnore'))}</p>`,
    };
};

const resetPage = ({ message, token, done = false, language = 'en' } = {}) => {
    const t = key => escapeHtml(text(language, key));
    return page(
        text(language, 'resetTitle'),
        `<h1>${t('resetHeading')}</h1>
${message ? `<p class="note" role="status">${escapeHtml(message)}</p>` : ''}
${
    token && !done
        ? `<form method="post" action="/reset-password">
<input type="hidden" name="token" value="${escapeHtml(token)}">
<input type="hidden" name="lang" value="${escapeHtml(language)}">
<label>${t('resetPassword')} <input name="password" type="password" autocomplete="new-password" minlength="8" required></label>
<label>${t('resetAgain')} <input name="confirm" type="password" autocomplete="new-password" minlength="8" required></label>
<button type="submit">${t('resetSave')}</button>
</form>`
        : ''
}
<p><a href="/privacy">${t('privacy')}</a></p>`,
        language,
    );
};

/** What is wrong with the new password (in `language`), or null. */
const newPasswordError = (password, confirm, language) => {
    const invalid = passwordError(password);
    if (invalid) {
        // The shared rule answers in English (see packages/shared/src/validation.ts).
        return invalid === 'The password is too long.' ? text(language, 'passwordLong') : text(language, 'passwordShort', { min: PASSWORD_MIN });
    }
    return password !== confirm ? text(language, 'passwordsDiffer') : null;
};

export const passwordReset = () => {
    const router = Router();

    // The app: `{ email, language? }`. Always the same answer, whether an account uses the email
    // or not (nobody can find out which emails have accounts), and the mail goes out in the
    // background (so the answer takes as long either way).
    router.post('/api/auth/forgot-password', requestsPerAddress, async (req, res) => {
        if (!resetAvailable()) {
            return res.status(503).send({ message: 'Password reset is not set up on this server yet.' });
        }
        const email = req.body?.email;
        if (emailError(email)) return res.status(400).send({ message: emailError(email) });
        const address = email.trim().toLowerCase();
        if (!mailsPerEmail(address)) return res.status(429).send({ message: TOO_MANY });
        const language = languageOf(req.body?.language);
        try {
            const user = await User.findOne({ where: { email: email.trim() }, attributes: ['id', 'username', 'email'] });
            if (user) {
                const token = newRefreshToken();
                // A new link replaces the older ones.
                await PasswordReset.destroy({ where: { user_id: user.id } });
                await PasswordReset.create({ user_id: user.id, token_hash: hashToken(token), expires_at: new Date(Date.now() + RESET_MINUTES * 60 * 1000) });
                sendMail({ to: user.email, ...mailFor(user.username, resetLink(token, language), language) }).catch(error =>
                    console.log('RESET MAIL FAILED', error.message),
                );
            }
            return res.status(200).send({ message: SENT });
        } catch (error) {
            return serverError(res, error, 'FORGOT PASSWORD');
        }
    });

    // The page the email links to.
    router.get('/reset-password', async (req, res) => {
        const language = languageOfRequest(req);
        try {
            const token = req.query.token;
            const reset = await validReset(token);
            return res
                .status(reset ? 200 : 400)
                .type('html')
                .send(reset ? resetPage({ token, language }) : resetPage({ message: text(language, 'resetExpired'), language }));
        } catch (error) {
            console.log('RESET PAGE FAILED', error.message);
            return res.status(500).type('html').send(resetPage({ message: text(language, 'somethingWrong'), language }));
        }
    });

    // The page's form: the new password. Every phone logged in to the account is logged out.
    router.post('/reset-password', express.urlencoded({ extended: false, limit: '4kb' }), async (req, res) => {
        const language = languageOfRequest(req);
        if (!resetsPerAddress(String(req.ip))) return res.status(429).type('html').send(resetPage({ message: text(language, 'tooMany'), language }));
        const { token, password, confirm } = req.body ?? {};
        try {
            const reset = await validReset(token);
            if (!reset) return res.status(400).type('html').send(resetPage({ message: text(language, 'resetExpired'), language }));
            const invalid = newPasswordError(password, confirm, language);
            if (invalid) return res.status(400).type('html').send(resetPage({ message: invalid, token, language }));

            const hash = await bcrypt.hash(password, PASSWORD_ROUNDS);
            await db.sequelize.transaction(async transaction => {
                // Deleted first: of two submissions with the same link, only one changes the password.
                const used = await PasswordReset.destroy({ where: { id: reset.id }, transaction });
                if (!used) throw new Error('link already used');
                await User.update({ password: hash }, { where: { id: reset.user_id }, transaction });
                await PasswordReset.destroy({ where: { user_id: reset.user_id }, transaction });
                await db.refresh_token.destroy({ where: { user_id: reset.user_id }, transaction });
            });
            return res.type('html').send(resetPage({ message: text(language, 'resetDone'), done: true, language }));
        } catch (error) {
            if (error.message === 'link already used') return res.status(400).type('html').send(resetPage({ message: text(language, 'resetExpired'), language }));
            console.log('RESET FAILED', error.message);
            return res.status(500).type('html').send(resetPage({ message: text(language, 'somethingWrong'), language }));
        }
    });

    return router;
};
