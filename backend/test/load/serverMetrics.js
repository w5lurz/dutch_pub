// Preloaded into the server under load (`node --import ./test/load/serverMetrics.js src/app.js`):
// every 2 seconds prints one `METRICS {...}` line with memory, CPU, event loop delay and the
// time spent writing game snapshots. Only for the load test; the real server never loads it.
import { monitorEventLoopDelay, performance } from 'node:perf_hooks';

const delay = monitorEventLoopDelay({ resolution: 10 });
delay.enable();
let lastCpu = process.cpuUsage();
let lastTime = performance.now();
const snapshots = { writes: 0, ms: 0, maxMs: 0 };

// The same module instance as the server's (same file URL): time the snapshot queries.
import('../../src/models/index.js').then(({ default: db }) => {
    for (const method of ['upsert', 'bulkCreate']) {
        const original = db.game_snapshot[method].bind(db.game_snapshot);
        db.game_snapshot[method] = async (...args) => {
            const start = performance.now();
            try {
                return await original(...args);
            } finally {
                const ms = performance.now() - start;
                snapshots.writes++;
                snapshots.ms += ms;
                snapshots.maxMs = Math.max(snapshots.maxMs, ms);
            }
        };
    }
});

setInterval(() => {
    const cpu = process.cpuUsage(lastCpu);
    const now = performance.now();
    const wallUs = (now - lastTime) * 1000;
    lastCpu = process.cpuUsage();
    lastTime = now;
    const memory = process.memoryUsage();
    const metrics = {
        rssMb: memory.rss / 2 ** 20,
        heapMb: memory.heapUsed / 2 ** 20,
        cpuPct: ((cpu.user + cpu.system) / wallUs) * 100,
        loopP50: delay.percentile(50) / 1e6,
        loopP99: delay.percentile(99) / 1e6,
        loopMax: delay.max / 1e6,
        ...snapshots,
    };
    console.log(`METRICS ${JSON.stringify(metrics)}`);
    delay.reset();
    Object.assign(snapshots, { writes: 0, ms: 0, maxMs: 0 });
}, 2000).unref();
