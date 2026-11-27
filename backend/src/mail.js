// Sending email (password reset links), through any SMTP provider: a Gmail address with an app
// password is enough for a beta; a transactional provider (Brevo, Postmark, Resend, Amazon SES,
// ...) with its own domain later. Everything comes from the environment:
//   SMTP_HOST, SMTP_PORT (587; 465 = TLS from the start), SMTP_USER, SMTP_PASS, MAIL_FROM.
// Tests set MAIL_OUTBOX instead: the mails are appended to that file (one JSON per line).

import fs from 'node:fs/promises';
import nodemailer from 'nodemailer';

let transport = null;

/** Whether this server can send email. */
export const mailConfigured = () => Boolean(process.env.MAIL_OUTBOX || (process.env.SMTP_HOST && process.env.MAIL_FROM));

const getTransport = () => {
    const port = Number(process.env.SMTP_PORT ?? 587);
    transport ??= nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        // Port 587: the connection must switch to TLS before the password is sent.
        requireTLS: port !== 465,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    return transport;
};

/** Sends `{ to, subject, text, html }` from MAIL_FROM. Throws when the provider refuses it. */
export const sendMail = async ({ to, subject, text, html }) => {
    if (process.env.MAIL_OUTBOX) {
        await fs.appendFile(process.env.MAIL_OUTBOX, `${JSON.stringify({ to, subject, text, html })}\n`);
        return;
    }
    await getTransport().sendMail({ from: process.env.MAIL_FROM, to, subject, text, html });
};
