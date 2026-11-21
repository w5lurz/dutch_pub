// "Forgot password?": the app asks for a link (`POST /api/auth/forgot-password`), the email
// brings the user to a web page on this server (`/reset-password?token=...`) where they choose
// a new password. A web page, not the app: it works on whatever device reads the email.
//
// Needs PUBLIC_URL (the server's address as the phones reach it, e.g. https://dutchpub.example)
// and a way to send mail (mail.js). The link is built from PUBLIC_URL, never from the request's
// Host header: a forged header would otherwise send someone's reset link to another site.

import bcrypt from 'bcryptjs';
import express, { Router } from 'express';
import { emailError, passwordError } from '@dutch-pub/shared';

import { PASSWORD_ROUNDS } from './account.js';
import { mailConfigured, sendMail } from './mail.js';
import { hashToken, newRefreshToken } from './middleware/authJwt.js';
import db from './models/index.js';
import { escapeHtml, page } from './pages.js';
import { limiter, rateLimit, TOO_MANY } from './rateLimit.js';
import { serverError } from './utils/utils.js';

const User = db.user;
const PasswordReset = db.password_reset;

/** How long a link works. */
const RESET_MINUTES = Number(process.env.PASSWORD_RESET_MINUTES ?? 60);
const HOUR = 60 * 60 * 1000;

/** Whether password reset is set up on this server. */
export const resetAvailable = () => mailConfigured() && Boolean(process.env.PUBLIC_URL);

const resetLink = token => `${process.env.PUBLIC_URL.replace(/\/+$/, '')}/reset-password?token=${encodeURIComponent(token)}`;

// At most 3 emails per address per hour (nobody's inbox gets flooded), and some per phone.
const mailsPerEmail = limiter({ windowMs: HOUR, max: 3 });
const requestsPerAddress = rateLimit({ windowMs: HOUR, max: 10 });
const resetsPerAddress = limiter({ windowMs: 15 * 60 * 1000, max: 20 });

const SENT = `If an account uses this email, a link to set a new password is on its way. It works for ${RESET_MINUTES} minutes.`;

/** The reset row of a link's token, if it is known and not expired. */
const validReset = async token => {
    if (typeof token !== 'string' || !token || token.length > 200) return null;
    const reset = await PasswordReset.findOne({ where: { token_hash: hashToken(token) } });
    return reset && reset.expires_at > new Date() ? reset : null;
};

const mailFor = (username, link) => ({
    subject: 'Set a new Dutch Pub password',
    text: `Hi ${username},\n\nSomeone (hopefully you) asked to set a new password for your Dutch Pub account. Open this link within ${RESET_MINUTES} minutes:\n\n${link}\n\nIf it wasn't you, ignore this email: your password stays as it is.\n`,
    html: `<p>Hi ${escapeHtml(username)},</p>
<p>Someone (hopefully you) asked to set a new password for your Dutch Pub account. Open this link within ${RESET_MINUTES} minutes:</p>
<p><a href="${escapeHtml(link)}">Set a new password</a></p>
<p>If it wasn't you, ignore this email: your password stays as it is.</p>`,
});

const resetPage = ({ message, token, done = false } = {}) =>
    page(
        'Set a new Dutch Pub password',
        `<h1>Set a new password</h1>
${message ? `<p class="note" role="status">${escapeHtml(message)}</p>` : ''}
${
    token && !done
        ? `<form method="post" action="/reset-password">
<input type="hidden" name="token" value="${escapeHtml(token)}">
<label>New password <input name="password" type="password" autocomplete="new-password" minlength="8" required></label>
<label>New password again <input name="confirm" type="password" autocomplete="new-password" minlength="8" required></label>
<button type="submit">Save the new password</button>
</form>`
        : ''
}
<p><a href="/privacy">Privacy policy</a></p>`,
    );

const EXPIRED = 'This link has expired or was already used. Ask for a new one in the app: Log in → Forgot password?';

export const passwordReset = () => {
    const router = Router();

    // The app: `{ email }`. Always the same answer, whether an account uses the email or not
    // (nobody can find out which emails have accounts), and the mail goes out in the background
    // (so the answer takes as long either way).
    router.post('/api/auth/forgot-password', requestsPerAddress, async (req, res) => {
        if (!resetAvailable()) {
            return res.status(503).send({ message: 'Password reset is not set up on this server yet.' });
        }
        const email = req.body?.email;
        if (emailError(email)) return res.status(400).send({ message: emailError(email) });
        const address = email.trim().toLowerCase();
        if (!mailsPerEmail(address)) return res.status(429).send({ message: TOO_MANY });
        try {
            const user = await User.findOne({ where: { email: email.trim() }, attributes: ['id', 'username', 'email'] });
            if (user) {
                const token = newRefreshToken();
                // A new link replaces the older ones.
                await PasswordReset.destroy({ where: { user_id: user.id } });
                await PasswordReset.create({ user_id: user.id, token_hash: hashToken(token), expires_at: new Date(Date.now() + RESET_MINUTES * 60 * 1000) });
                sendMail({ to: user.email, ...mailFor(user.username, resetLink(token)) }).catch(error =>
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
        try {
            const token = req.query.token;
            const reset = await validReset(token);
            return res.status(reset ? 200 : 400).type('html').send(reset ? resetPage({ token }) : resetPage({ message: EXPIRED }));
        } catch (error) {
            console.log('RESET PAGE FAILED', error.message);
            return res.status(500).type('html').send(resetPage({ message: 'Something went wrong. Please try again later.' }));
        }
    });

    // The page's form: the new password. Every phone logged in to the account is logged out.
    router.post('/reset-password', express.urlencoded({ extended: false, limit: '4kb' }), async (req, res) => {
        if (!resetsPerAddress(String(req.ip))) return res.status(429).type('html').send(resetPage({ message: TOO_MANY }));
        const { token, password, confirm } = req.body ?? {};
        try {
            const reset = await validReset(token);
            if (!reset) return res.status(400).type('html').send(resetPage({ message: EXPIRED }));
            const invalid = passwordError(password) ?? (password !== confirm ? 'The two passwords are not the same.' : null);
            if (invalid) return res.status(400).type('html').send(resetPage({ message: invalid, token }));

            const hash = await bcrypt.hash(password, PASSWORD_ROUNDS);
            await db.sequelize.transaction(async transaction => {
                // Deleted first: of two submissions with the same link, only one changes the password.
                const used = await PasswordReset.destroy({ where: { id: reset.id }, transaction });
                if (!used) throw new Error('link already used');
                await User.update({ password: hash }, { where: { id: reset.user_id }, transaction });
                await PasswordReset.destroy({ where: { user_id: reset.user_id }, transaction });
                await db.refresh_token.destroy({ where: { user_id: reset.user_id }, transaction });
            });
            return res.type('html').send(resetPage({ message: 'Your password has been changed. Open Dutch Pub and log in with it.', done: true }));
        } catch (error) {
            if (error.message === 'link already used') return res.status(400).type('html').send(resetPage({ message: EXPIRED }));
            console.log('RESET FAILED', error.message);
            return res.status(500).type('html').send(resetPage({ message: 'Something went wrong. Please try again later.' }));
        }
    });

    return router;
};
