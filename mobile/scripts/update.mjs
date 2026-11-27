// Publishes an over-the-air update (`eas update`) and uploads its source maps to Sentry, so crash
// reports from the update show the real files and lines.
//
//   node scripts/update.mjs preview "What changed"
//   node scripts/update.mjs production "What changed"
//
// The Sentry token comes from `.env.sentry-build-plugin` in this folder (git-ignored), with
// SENTRY_AUTH_TOKEN, SENTRY_ORG and SENTRY_PROJECT. Without that file the update is still
// published; only the source maps are skipped.
//
// Not an npm script on purpose: package.json's scripts are part of the app's fingerprint, and
// changing them would make updates skip the installed apps (see MAINTENANCE.md).
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const [channel, message] = process.argv.slice(2);
if (!['preview', 'production'].includes(channel) || !message) {
    console.error('Usage: node scripts/update.mjs preview|production "What changed"');
    process.exit(1);
}

/** Runs a command, printing its output; stops the script when it fails. */
const run = (command, args, env = process.env) => {
    const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32', env });
    if (result.status !== 0) process.exit(result.status ?? 1);
};
// Through the shell on Windows (npx is a .cmd there): the message must be quoted for it.
const quoted = (text) => (process.platform === 'win32' ? `"${text.replace(/"/g, '\\"')}"` : text);

run('npm', ['run', 'build:shared']);
run('npx', ['eas-cli@latest', 'update', '--channel', channel, '--environment', channel, '--message', quoted(message), '--non-interactive']);

if (existsSync('.env.sentry-build-plugin')) {
    // eas update leaves the bundles and their source maps in dist/.
    // The project is in Sentry's EU region (the uploader needs the address, or it gives up). On
    // Windows it can't start sentry-cli's Node wrapper itself: it gets the .exe.
    const windowsCli = resolve('node_modules/@sentry/cli-win32-x64/bin/sentry-cli.exe');
    run('npx', ['sentry-expo-upload-sourcemaps', 'dist'], {
        ...process.env,
        SENTRY_URL: process.env.SENTRY_URL ?? 'https://de.sentry.io/',
        ...(process.platform === 'win32' && existsSync(windowsCli) && !process.env.SENTRY_CLI_EXECUTABLE ? { SENTRY_CLI_EXECUTABLE: windowsCli } : {}),
    });
} else {
    console.warn('No .env.sentry-build-plugin: source maps not uploaded to Sentry.');
}
