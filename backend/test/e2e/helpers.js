import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const getFreePort = () =>
    new Promise((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on('error', reject);
        server.listen(0, () => {
            const { port } = server.address();
            server.close(() => resolve(port));
        });
    });

/**
 * Starts the real backend (src/app.js) as a child process on a free port, using the
 * database from backend/.env. Serves a stub frontend so SPA routes can be tested
 * without a frontend build.
 */
export async function startServer() {
    const port = await getFreePort();
    const frontendRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dutch-pub-frontend-'));
    fs.writeFileSync(path.join(frontendRoot, 'index.html'), '<!doctype html><div id="root"></div>');

    const child = spawn(process.execPath, ['src/app.js'], {
        cwd: backendDir,
        env: { ...process.env, PORT: String(port), FRONTEND_ROOT: frontendRoot },
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', chunk => (output += chunk));
    child.stderr.on('data', chunk => (output += chunk));

    await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(`Server did not start within 20s:\n${output}`)), 20000);
        const onData = () => {
            if (output.includes(`Listening on port ${port}`)) {
                clearTimeout(timeout);
                resolve();
            }
        };
        child.stdout.on('data', onData);
        child.on('exit', code => {
            clearTimeout(timeout);
            reject(new Error(`Server exited with code ${code}:\n${output}`));
        });
    });

    return {
        baseUrl: `http://localhost:${port}`,
        getOutput: () => output,
        async stop() {
            child.removeAllListeners('exit');
            if (child.exitCode === null) {
                const exited = new Promise(resolve => child.once('exit', resolve));
                child.kill();
                await exited;
            }
            fs.rmSync(frontendRoot, { recursive: true, force: true });
        },
    };
}

/** Resolves with the arguments of the next `event` on `socket`, or rejects after `ms`. */
export const waitFor = (socket, event, ms = 5000) =>
    new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(`Timed out waiting for "${event}"`)), ms);
        socket.once(event, (...args) => {
            clearTimeout(timeout);
            resolve(args);
        });
    });
