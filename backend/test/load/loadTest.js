// Load test: how many rooms one server holds. For each level it starts a throwaway server (a free
// port, its own snapshot scope, the database from backend/.env) and fills it with bot tables that
// play whole games at a human pace, game after game, plus people idling on the room list. Then it
// measures for a while: the server's memory, CPU and event loop delay (serverMetrics.js), how long
// a move takes to come back to the player, and how much data the phones would receive.
//
//   node test/load/loadTest.js --levels=10,50,100,200 --players=4 --think=1000 --steady=30
//
// Room owners must be registered: throwaway `ld<stamp>_<n>` users are created in the database and
// deleted afterwards, with their played games. The bots run in worker threads (a phone parses only
// its own messages; one thread for all the bots would measure the bots, not the server).
import 'dotenv/config';
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { monitorEventLoopDelay, performance } from 'node:perf_hooks';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------------------------
// Main thread: users, server, workers, report.

async function main() {
    const options = Object.fromEntries(
        process.argv.slice(2).map(arg => {
            const [key, value] = arg.replace(/^--/, '').split('=');
            return [key, value];
        }),
    );
    const levels = (options.levels ?? '10,50,100,200').split(',').map(Number);
    const players = Number(options.players ?? 4);
    const think = Number(options.think ?? 1000); // ms a bot "thinks" before each move (±50%)
    const steadySeconds = Number(options.steady ?? 30);
    const rampPerSecond = Number(options.ramp ?? 20); // new tables per second while filling up
    const lobbyPerRoom = Number(options.lobby ?? 0.25); // people on the room list, per room
    const workerCount = Number(options.workers ?? 8);

    const { default: db } = await import('../../src/models/index.js');
    const { Op } = await import('sequelize');
    const { signGuestToken, signUserToken } = await import('../../src/middleware/authJwt.js');

    const stamp = Date.now().toString(36).slice(-5);
    const maxTables = Math.max(...levels);
    console.log(`Creating ${maxTables} throwaway owners (ld${stamp}_*)...`);
    await db.user.bulkCreate(
        Array.from({ length: maxTables }, (_, i) => ({ username: `ld${stamp}_${i}`, email: `ld${stamp}_${i}@load.test`, password: 'not-a-login' })),
    );
    const owners = await db.user.findAll({ where: { username: { [Op.like]: `ld${stamp}_%` } }, attributes: ['id', 'username'], raw: true });
    owners.sort((a, b) => Number(a.username.split('_')[1]) - Number(b.username.split('_')[1]));
    let guestId = 1;
    const tables = owners.map((owner, i) => ({
        index: i,
        owner: { name: owner.username, token: signUserToken(owner) },
        guests: Array.from({ length: players - 1 }, (_, j) => {
            const guest = { id: guestId++, username: `lg${stamp}_${i}_${j}` };
            return { name: guest.username, token: signGuestToken(guest) };
        }),
    }));

    const rows = [];
    try {
        for (const level of levels) {
            rows.push(await runLevel({ level, tables: tables.slice(0, level), think, steadySeconds, rampPerSecond, lobbyPerRoom, workerCount }));
            printTable(rows, { players, think });
        }
    } finally {
        console.log('Cleaning up the throwaway users, their games and snapshots...');
        await db.played_game.destroy({ where: { [Op.or]: [{ players: { [Op.like]: `%ld${stamp}_%` } }, { players: { [Op.like]: `%lg${stamp}_%` } }] } });
        await db.game_snapshot.destroy({ where: { scope: { [Op.like]: 'load-%' } } });
        await db.user.destroy({ where: { username: { [Op.like]: `ld${stamp}_%` } } });
        await db.sequelize.close();
    }
}

async function runLevel({ level, tables, think, steadySeconds, rampPerSecond, lobbyPerRoom, workerCount }) {
    const server = await startServer();
    const lobby = Math.ceil(level * lobbyPerRoom);
    const count = Math.min(workerCount, level);
    const totals = { moves: 0, latencies: [], bytes: 0, playerBytes: 0, lobbyBytes: 0, errors: {}, games: 0, stops: 0, ready: 0, failed: 0, failures: [], clientLoopP99: 0 };
    const workers = Array.from({ length: count }, (_, w) => {
        const worker = new Worker(fileURLToPath(import.meta.url), {
            workerData: {
                baseUrl: server.baseUrl,
                tables: tables.filter((_, i) => i % count === w),
                lobby: Math.floor(lobby / count) + (w < lobby % count ? 1 : 0),
                think,
                rampPerSecond: rampPerSecond / count,
            },
        });
        worker.on('message', tick => {
            totals.moves += tick.moves;
            totals.latencies.push(...tick.latencies);
            totals.bytes += tick.bytes;
            totals.playerBytes += tick.playerBytes;
            totals.lobbyBytes += tick.lobbyBytes;
            for (const [reason, n] of Object.entries(tick.errors)) totals.errors[reason] = (totals.errors[reason] ?? 0) + n;
            totals.games += tick.games;
            totals.stops += tick.stops;
            totals.ready += tick.ready;
            totals.failed += tick.failed;
            totals.failures.push(...tick.failures);
            totals.clientLoopP99 = Math.max(totals.clientLoopP99, tick.loopP99);
        });
        worker.on('error', error => totals.failures.push(`worker: ${error.message}`));
        return worker;
    });

    // Filling up: until every table started its first game (or it takes far too long).
    const rampStart = performance.now();
    const rampLimit = (level / rampPerSecond) * 1000 + 60000;
    while (totals.ready + totals.failed < level && performance.now() - rampStart < rampLimit) await sleep(250);
    const rampSeconds = (performance.now() - rampStart) / 1000;
    const readyTables = totals.ready;
    await sleep(5000); // settle

    // Measuring.
    Object.assign(totals, { moves: 0, latencies: [], bytes: 0, playerBytes: 0, lobbyBytes: 0, errors: {}, games: 0, stops: 0, clientLoopP99: 0 });
    server.metrics.length = 0;
    const start = performance.now();
    await sleep(steadySeconds * 1000);
    const seconds = (performance.now() - start) / 1000;
    const metrics = [...server.metrics];
    const result = { ...totals, latencies: [...totals.latencies], errors: { ...totals.errors } };

    for (const worker of workers) worker.postMessage('stop');
    await Promise.all(workers.map(worker => new Promise(resolve => worker.once('exit', resolve))));
    await server.stop();

    const sorted = result.latencies.sort((a, b) => a - b);
    const pct = p => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor((sorted.length * p) / 100))] : NaN);
    const avg = key => metrics.reduce((sum, m) => sum + m[key], 0) / Math.max(1, metrics.length);
    const max = key => Math.max(0, ...metrics.map(m => m[key]));
    const errorCount = Object.values(result.errors).reduce((a, b) => a + b, 0);
    return {
        rooms: level,
        ready: readyTables,
        sockets: level * (tables[0].guests.length + 1) + lobby,
        rampSeconds,
        cpu: avg('cpuPct'),
        rssMb: max('rssMb'),
        heapMb: max('heapMb'),
        loopP99: max('loopP99'),
        loopMax: max('loopMax'),
        snapshotBusyPct: (metrics.reduce((sum, m) => sum + m.ms, 0) / Math.max(1, metrics.length * 2000)) * 100,
        snapshotAvgMs: metrics.reduce((sum, m) => sum + m.ms, 0) / Math.max(1, metrics.reduce((sum, m) => sum + m.writes, 0)),
        movesPerSecond: result.moves / seconds,
        p50: pct(50),
        p95: pct(95),
        p99: pct(99),
        latencyMax: sorted.at(-1) ?? NaN,
        mbPerSecond: result.bytes / seconds / 2 ** 20,
        kbPerPlayerMessage: result.playerBytes / Math.max(1, result.moves * (tables[0].guests.length + 1)) / 1024,
        lobbyKbPerSecond: lobby ? result.lobbyBytes / seconds / lobby / 1024 : 0,
        games: result.games,
        stops: result.stops,
        errors: errorCount,
        errorKinds: result.errors,
        failed: result.failed,
        failures: result.failures.slice(0, 3),
        clientLoopP99: result.clientLoopP99,
    };
}

function printTable(rows, { players, think }) {
    const f = (n, d = 0) => (Number.isFinite(n) ? n.toFixed(d) : '-');
    console.log(`\n${players} players per room, ~${think} ms per move`);
    console.log(
        'rooms | ready | sockets | ramp s | CPU % | RSS MB | heap MB | loop p99 / max ms | snapshots busy % (avg ms) | moves/s | move ms p50/p95/p99/max | MB/s out | KB per update | lobby KB/s each | games | errors | failed | bots loop p99',
    );
    for (const r of rows) {
        console.log(
            [
                r.rooms,
                r.ready,
                r.sockets,
                f(r.rampSeconds, 1),
                f(r.cpu),
                f(r.rssMb),
                f(r.heapMb),
                `${f(r.loopP99, 1)} / ${f(r.loopMax)}`,
                `${f(r.snapshotBusyPct)} (${f(r.snapshotAvgMs, 1)})`,
                f(r.movesPerSecond, 1),
                `${f(r.p50)}/${f(r.p95)}/${f(r.p99)}/${f(r.latencyMax)}`,
                f(r.mbPerSecond, 2),
                f(r.kbPerPlayerMessage, 1),
                f(r.lobbyKbPerSecond, 1),
                r.games,
                r.errors,
                r.failed,
                f(r.clientLoopP99),
            ].join(' | '),
        );
        if (r.errors) console.log('   errors:', JSON.stringify(r.errorKinds));
        if (r.failures.length) console.log('   failures:', r.failures.join(' || '));
    }
}

const getFreePort = () =>
    new Promise((resolve, reject) => {
        const probe = net.createServer();
        probe.unref();
        probe.on('error', reject);
        probe.listen(0, () => {
            const { port } = probe.address();
            probe.close(() => resolve(port));
        });
    });

async function startServer() {
    const port = await getFreePort();
    const child = spawn(process.execPath, ['--import', './test/load/serverMetrics.js', 'src/app.js'], {
        cwd: backendDir,
        env: {
            ...process.env,
            PORT: String(port),
            CORS_ORIGIN: '',
            SNAPSHOT_SCOPE: `load-${port}`,
            // Nothing leaves the machine (the bots register no push tokens anyway).
            PUSH_URL: 'http://127.0.0.1:9/',
            MAIL_OUTBOX: '',
            SMTP_HOST: '',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    const metrics = [];
    let output = '';
    let pending = '';
    child.stdout.on('data', chunk => {
        output += chunk;
        pending += chunk;
        const lines = pending.split('\n');
        pending = lines.pop();
        for (const line of lines) if (line.startsWith('METRICS ')) metrics.push(JSON.parse(line.slice(8)));
    });
    child.stderr.on('data', chunk => (output += chunk));
    await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(`Server did not start within 20s:\n${output}`)), 20000);
        const check = () => {
            if (output.includes(`Listening on port ${port}`)) {
                clearTimeout(timeout);
                resolve();
            }
        };
        child.stdout.on('data', check);
        child.on('exit', code => {
            clearTimeout(timeout);
            reject(new Error(`Server exited with code ${code}:\n${output.slice(-2000)}`));
        });
    });
    child.removeAllListeners('exit');
    return {
        baseUrl: `http://127.0.0.1:${port}`,
        metrics,
        async stop() {
            if (child.exitCode === null) {
                const exited = new Promise(resolve => child.once('exit', resolve));
                child.kill();
                await exited;
            }
        },
    };
}

// ---------------------------------------------------------------------------------------------
// Worker threads: bot tables and lobby watchers.

async function runWorker() {
    const { io } = await import('socket.io-client');
    const { canLayCard } = await import('@dutch-pub/shared');
    const { baseUrl, tables, lobby, think, rampPerSecond } = workerData;

    let stopping = false;
    const sockets = [];
    const loop = monitorEventLoopDelay({ resolution: 10 });
    loop.enable();
    const fresh = () => ({ moves: 0, latencies: [], bytes: 0, playerBytes: 0, lobbyBytes: 0, errors: {}, games: 0, stops: 0, ready: 0, failed: 0, failures: [] });
    let stats = fresh();
    const report = () => {
        parentPort.postMessage({ ...stats, loopP99: loop.percentile(99) / 1e6 });
        stats = fresh();
        loop.reset();
    };
    const ticker = setInterval(report, 1000);
    parentPort.on('message', message => {
        if (message !== 'stop') return;
        stopping = true;
        clearInterval(ticker);
        report();
        sockets.forEach(socket => socket.close());
        setTimeout(() => process.exit(0), 100);
    });

    const thinkTime = () => think * (0.5 + Math.random());
    // The room list events: the server sends changes together, under the latest event's name.
    const ROOM_LISTS = ['rooms-listed', 'joined-room', 'left-room', 'room-deleted'];

    const connect = (token, kind) =>
        new Promise((resolve, reject) => {
            const socket = io(baseUrl, { transports: ['websocket'], reconnection: false, ...(token && { auth: { token } }) });
            sockets.push(socket);
            socket.once('connect', () => {
                socket.io.engine.on('message', data => {
                    const size = typeof data === 'string' ? data.length : data.byteLength;
                    stats.bytes += size;
                    if (kind === 'lobby') stats.lobbyBytes += size;
                    else stats.playerBytes += size;
                });
                resolve(socket);
            });
            socket.once('connect_error', error => reject(new Error(`connect: ${error.message}`)));
        });

    /** Resolves with the arguments of the first of `events` on `socket` that `accept` takes. */
    const waitFor = (socket, events, accept, ms) =>
        new Promise((resolve, reject) => {
            const handlers = events.map(event => [
                event,
                (...args) => {
                    if (!accept(args, event)) return;
                    done();
                    resolve([event, ...args]);
                },
            ]);
            const done = () => {
                clearTimeout(timer);
                handlers.forEach(([event, handler]) => socket.off(event, handler));
            };
            const timer = setTimeout(() => {
                done();
                reject(new Error(`timed out waiting for ${events.join('/')}`));
            }, ms);
            handlers.forEach(([event, handler]) => socket.on(event, handler));
        });

    /** As the e2e bots: lowest playable card (magic cards last), 30% a random one; pick up when nothing fits. */
    const botMove = view => {
        const { hand, tableFlipped } = view.userCards;
        const pick = cards => {
            const playable = cards
                .map((card, index) => ({ card, index }))
                .filter(({ card }) => canLayCard(card, view.laidCards))
                .sort((x, y) => Number(!!x.card.isMagicCard) - Number(!!y.card.isMagicCard) || x.card.value - y.card.value);
            return Math.random() < 0.3 ? playable[Math.floor(Math.random() * playable.length)] : playable[0];
        };
        if (hand.length > 0 || tableFlipped.length > 0) {
            const choice = pick(hand.length > 0 ? hand : tableFlipped);
            return choice ? { event: 'lay-card', payload: { card: choice.card, cardIndex: choice.index } } : { event: 'draw-cards', payload: {} };
        }
        return { event: 'lay-card', payload: { card: 0, cardIndex: 0 } };
    };

    class Bot {
        constructor({ name, token }, table) {
            Object.assign(this, { name, token, table, view: null, timer: null, sentAt: null, readySent: false, roomId: null, rejects: 0 });
        }
        async connect() {
            this.socket = await connect(this.token, 'player');
            if (process.env.LOAD_DEBUG) this.socket.onAny((event, first) => console.log(this.name, event, typeof first === 'object' ? JSON.stringify(first).slice(0, 120) : first));
            for (const event of ['game-started', 'card-laid', 'cards-drawn', 'game-updated']) this.socket.on(event, view => this.onView(view));
            for (const event of ['lay-card-rejected', 'action-rejected']) {
                this.socket.on(event, reason => {
                    stats.errors[reason] = (stats.errors[reason] ?? 0) + 1;
                    this.sentAt = null;
                    this.rejects++;
                    this.schedule();
                });
            }
        }
        onView(view) {
            if (this.sentAt !== null) {
                stats.latencies.push(performance.now() - this.sentAt);
                stats.moves++;
                this.table.moves++;
                this.sentAt = null;
            }
            this.view = view;
            this.rejects = 0;
            this.schedule();
        }
        schedule() {
            clearTimeout(this.timer);
            const view = this.view;
            if (!view || stopping || this.roomId === null) return;
            if (view.phase === 'swap') {
                if (!view.ready && !this.readySent) {
                    this.timer = setTimeout(() => {
                        this.readySent = true;
                        this.socket.emit('player-ready', { roomId: this.roomId, username: this.name });
                    }, thinkTime());
                }
                return;
            }
            if (!view.active || view.blindMiss) return;
            this.timer = setTimeout(() => {
                if (stopping) return;
                const move = this.rejects >= 2 ? { event: 'draw-cards', payload: {} } : botMove(this.view);
                this.sentAt = performance.now();
                this.socket.emit(move.event, { ...move.payload, roomId: this.roomId, username: this.name });
            }, thinkTime());
        }
        reset() {
            clearTimeout(this.timer);
            Object.assign(this, { view: null, sentAt: null, readySent: false, roomId: null, rejects: 0 });
        }
    }

    const runTable = async spec => {
        const table = { moves: 0 };
        const owner = new Bot(spec.owner, table);
        const bots = [owner, ...spec.guests.map(guest => new Bot(guest, table))];
        try {
            await Promise.all(bots.map(bot => bot.connect()));
            let first = true;
            while (!stopping) {
                owner.socket.emit('create-room', { name: `load ${spec.index}`, owner: owner.name, slots: bots.length, visibility: 'public', settings: { turnTimer: 30 } });
                const [, rooms] = await waitFor(owner.socket, ROOM_LISTS, ([list]) => Object.values(list).some(room => room.owner === owner.name), 30000);
                const roomId = Number(Object.keys(rooms).find(id => rooms[id].owner === owner.name));
                for (const guest of bots.slice(1)) {
                    const joined = waitFor(guest.socket, ROOM_LISTS, ([list]) => list[roomId]?.players.some(player => player.username === guest.name), 30000);
                    guest.socket.emit('join-room', { username: guest.name, roomId });
                    await joined;
                }
                bots.forEach(bot => (bot.roomId = roomId));
                table.moves = 0;
                const ended = waitFor(owner.socket, ['game-won', 'game-stopped'], () => true, 60 * 60 * 1000);
                const started = waitFor(owner.socket, ['game-started'], () => true, 30000);
                owner.socket.emit('start-game', roomId);
                await started;
                if (first) {
                    stats.ready++;
                    first = false;
                }
                // A game that cycles forever (the bots are simple) is stopped by its owner.
                const guard = setInterval(() => {
                    if (table.moves > 1500) owner.socket.emit('stop-game', roomId);
                }, 1000);
                const [event] = await ended;
                clearInterval(guard);
                if (event === 'game-won') stats.games++;
                else stats.stops++;
                bots.forEach(bot => bot.reset());
                await sleep(thinkTime() * 2); // looking at the result
            }
        } catch (error) {
            if (stopping) return;
            stats.failed++;
            stats.failures.push(`${spec.owner.name}: ${error.message}`);
            bots.forEach(bot => bot.socket?.close());
        }
    };

    for (let i = 0; i < lobby; i++) {
        connect(null, 'lobby')
            .then(socket => socket.emit('list-rooms'))
            .catch(error => stats.failures.push(`lobby: ${error.message}`));
    }
    for (const spec of tables) {
        if (stopping) break;
        runTable(spec);
        await sleep(1000 / rampPerSecond);
    }
}

// Last, so every helper above is defined.
if (isMainThread) await main();
else await runWorker();
