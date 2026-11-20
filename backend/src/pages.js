// Web pages the stores ask for: the privacy policy (`/privacy`) and a way to delete an account
// without the app (`/account/delete`, required by Google Play). Plain HTML, no scripts.
// The contact address comes from the environment (PRIVACY_CONTACT), so it is not in the code.

import express, { Router } from 'express';

import { deleteAccount } from './account.js';
import db from './models/index.js';

const User = db.user;

const POLICY_DATE = '20 November 2026';

const escapeHtml = text =>
    String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

const page = (title, body) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  :root { color-scheme: light dark; --bg: #f9fafb; --fg: #111827; --muted: #4b5563; --card: #fff; --line: #e5e7eb; --accent: #b45309; --danger: #dc2626; }
  @media (prefers-color-scheme: dark) { :root { --bg: #111827; --fg: #f3f4f6; --muted: #9ca3af; --card: #1f2937; --line: #374151; --accent: #f59e0b; --danger: #f87171; } }
  body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  main { max-width: 720px; margin: 0 auto; padding: 24px 16px 48px; }
  h1 { font-size: 1.75rem; margin: 0 0 4px; }
  h2 { font-size: 1.15rem; margin: 28px 0 8px; }
  p, li { color: var(--fg); }
  .muted { color: var(--muted); }
  a { color: var(--accent); }
  ul { padding-left: 1.25rem; }
  form { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 16px; display: grid; gap: 12px; max-width: 420px; }
  label { display: grid; gap: 4px; font-weight: 600; }
  input { font: inherit; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--line); background: var(--bg); color: var(--fg); }
  button { font: inherit; font-weight: 600; padding: 10px 12px; border: 0; border-radius: 8px; background: var(--danger); color: #fff; cursor: pointer; }
  .note { padding: 12px 14px; border-radius: 8px; border: 1px solid var(--line); background: var(--card); }
</style>
</head>
<body><main>${body}</main></body>
</html>`;

const contact = () => {
    const email = process.env.PRIVACY_CONTACT;
    return email ? `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>` : 'the contact address on the app’s store page';
};

export const privacyPolicyHtml = () => {
    const owner = escapeHtml(process.env.PRIVACY_OWNER || 'the developer of Dutch Pub');
    return page(
        'Dutch Pub privacy policy',
        `<h1>Dutch Pub privacy policy</h1>
<p class="muted">Last updated: ${POLICY_DATE}</p>
<p>Dutch Pub is a card game for playing with friends. This policy explains what the app and its server keep about you, why, and for how long. Dutch Pub is run by ${owner} (“we”). Questions: ${contact()}.</p>

<h2>What we keep</h2>
<ul>
<li><strong>Your account</strong> (if you register): username, email address, your password (stored only as a one-way hash, never in plain text) and the avatar you picked.</li>
<li><strong>Guest name</strong> (if you play as a guest): the name you chose, kept only in the server’s memory while your guest session lasts (at most 7 days).</li>
<li><strong>Played games</strong>: for each finished game, the winner, the usernames of the players and the date. This makes up the leaderboard that every player can see.</li>
<li><strong>Rooms, games and chat</strong>: while a room exists, the server keeps its players, the cards and the chat messages, and saves them to its database every second so a game survives a server restart. They are deleted when the game ends or the room is closed, and at the latest after 24 hours.</li>
<li><strong>Sign-in tokens</strong>: so you stay logged in, the server keeps a hashed token for each phone you are logged in on, for up to 30 days. Logging out deletes it.</li>
<li><strong>Notification token</strong> (if you allow notifications): an address the push service gives your phone, used only to tell you when it is your turn. Logging out, turning notifications off or deleting your account removes it.</li>
<li><strong>Crash reports</strong> (only in app versions where crash reporting is turned on): when the app crashes, a report with the error, the app version, the phone model and operating system is sent to Sentry. It does not contain your cards, your chat or your password.</li>
<li><strong>Connection data</strong>: like any server, ours and its hosting provider see your IP address while you are connected and may keep it in short-lived technical logs.</li>
</ul>
<p>Settings such as sounds and notifications on / off are stored on your phone only.</p>

<h2>What we don’t do</h2>
<p>No ads, no tracking across apps or websites, no analytics, and we never sell or rent your data.</p>

<h2>Who else sees it</h2>
<ul>
<li><strong>Other players</strong> see your username, avatar, your moves and your chat messages in the rooms you join, and your wins on the leaderboard. Your email address is never shown to anyone.</li>
<li><strong>Service providers</strong> that run parts of the app for us: our server hosting provider; Expo (650 Industries), Google Firebase Cloud Messaging and Apple Push Notification service, which deliver notifications; Sentry, for crash reports when turned on. They may only use the data to provide their service to us.</li>
</ul>

<h2>Why we use it</h2>
<p>To run the game you asked to play (your account, rooms, games, chat, notifications), and to find and fix crashes (our legitimate interest in an app that works).</p>

<h2>Deleting your account</h2>
<p>In the app: <strong>Account</strong> tab → <strong>Delete account</strong>. Without the app: <a href="/account/delete">the account deletion page</a>. We then delete your account, avatar, sign-in and notification tokens right away. In past played games your name is replaced with “[deleted]”, so the other players keep their results, and you no longer appear on the leaderboard.</p>

<h2>Your rights</h2>
<p>You can ask us for a copy of your data, to correct it, to delete it, or object to how we use it: write to ${contact()}. If you are in the EU, you can also complain to your data protection authority (in Hungary: NAIH, <a href="https://naih.hu">naih.hu</a>).</p>

<h2>Children</h2>
<p>Dutch Pub is not meant for children under 13, and we do not knowingly keep data of children under 13. If you think a child has given us data, contact us and we will delete it.</p>

<h2>Changes</h2>
<p>If this policy changes, the new version will be on this page with a new date.</p>`,
    );
};

const deletePageHtml = (message, done = false) =>
    page(
        'Delete your Dutch Pub account',
        `<h1>Delete your Dutch Pub account</h1>
${message ? `<p class="note" role="status">${escapeHtml(message)}</p>` : ''}
${
    done
        ? ''
        : `<p>This deletes your account, avatar, sign-in and notification tokens. In past played games your name becomes “[deleted]”, so the other players keep their results. This cannot be undone.</p>
<p class="muted">You can also do this in the app: Account tab → Delete account. Guests have no account: their name is freed when they log out or their session runs out.</p>
<form method="post" action="/account/delete">
<label>Username <input name="username" autocomplete="username" required></label>
<label>Password <input name="password" type="password" autocomplete="current-password" required></label>
<button type="submit">Delete my account</button>
</form>`
}
<p><a href="/privacy">Privacy policy</a></p>`,
    );

export const pages = () => {
    const router = Router();

    router.get('/privacy', (req, res) => res.type('html').send(privacyPolicyHtml()));

    router.get('/account/delete', (req, res) => res.type('html').send(deletePageHtml()));

    router.post('/account/delete', express.urlencoded({ extended: false, limit: '4kb' }), async (req, res) => {
        const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
        try {
            const user = username ? await User.findOne({ where: { username } }) : null;
            const result = user ? await deleteAccount(user, req.body.password, req.app.get('io')) : { status: 401 };
            if (result.status === 204) {
                return res.type('html').send(deletePageHtml('Your account has been deleted.', true));
            }
            const message = result.status === 401 ? 'Wrong username or password.' : result.message;
            return res.status(result.status).type('html').send(deletePageHtml(message));
        } catch (error) {
            console.log('ACCOUNT DELETE FAILED', error.message);
            return res.status(500).type('html').send(deletePageHtml('Something went wrong. Please try again later.'));
        }
    });

    return router;
};
