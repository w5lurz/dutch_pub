// Synthesises the game's sound effects into assets/sounds/*.wav (mono, 16-bit, 22.05 kHz).
// Made from scratch (noise and sine waves), so there are no third-party licences to track.
// Run from mobile/: `node scripts/make-sounds.mjs`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 22050;
const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sounds');

// A fixed seed: running the script again gives the same files.
let seed = 12345;
const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
};
const noise = () => random() * 2 - 1;

const samples = seconds => new Float32Array(Math.round(seconds * RATE));

/** Adds a sine tone (frequency may glide from f0 to f1) with an attack / exponential decay envelope. */
function tone(buffer, { at = 0, length, f0, f1 = f0, gain = 0.5, attack = 0.005, decay = 8 }) {
    const start = Math.round(at * RATE);
    let phase = 0;
    for (let i = 0; i < Math.round(length * RATE) && start + i < buffer.length; i++) {
        const t = i / RATE;
        const frequency = f0 + (f1 - f0) * (t / length);
        phase += (2 * Math.PI * frequency) / RATE;
        const envelope = Math.min(1, t / attack) * Math.exp(-decay * t);
        buffer[start + i] += Math.sin(phase) * gain * envelope;
    }
}

/** Adds low-passed noise (a one-pole filter, `smooth` 0..1: higher = duller) with an envelope. */
function hiss(buffer, { at = 0, length, gain = 0.5, smooth = 0.6, attack = 0.002, decay = 30, swell = false }) {
    const start = Math.round(at * RATE);
    let last = 0;
    for (let i = 0; i < Math.round(length * RATE) && start + i < buffer.length; i++) {
        const t = i / RATE;
        last = last * smooth + noise() * (1 - smooth);
        const envelope = swell ? Math.sin(Math.PI * (t / length)) ** 2 : Math.min(1, t / attack) * Math.exp(-decay * t);
        buffer[start + i] += last * gain * envelope * 2.5;
    }
}

function writeWav(name, buffer) {
    const peak = buffer.reduce((max, value) => Math.max(max, Math.abs(value)), 0) || 1;
    const scale = Math.min(1, 0.9 / peak);
    const data = Buffer.alloc(buffer.length * 2);
    buffer.forEach((value, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, value * scale)) * 32767), i * 2));
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + data.length, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20); // PCM
    header.writeUInt16LE(1, 22); // mono
    header.writeUInt32LE(RATE, 24);
    header.writeUInt32LE(RATE * 2, 28);
    header.writeUInt16LE(2, 32);
    header.writeUInt16LE(16, 34);
    header.write('data', 36);
    header.writeUInt32LE(data.length, 40);
    fs.writeFileSync(path.join(outDir, `${name}.wav`), Buffer.concat([header, data]));
}

const sounds = {
    // A card slapped onto the pile: a short papery snap over a soft thump.
    lay() {
        const b = samples(0.14);
        hiss(b, { length: 0.08, gain: 0.6, smooth: 0.35, decay: 55 });
        tone(b, { length: 0.1, f0: 160, f1: 90, gain: 0.35, decay: 35 });
        return b;
    },
    // A move that isn't allowed: a dull two-step "bonk" downwards.
    invalid() {
        const b = samples(0.32);
        tone(b, { length: 0.14, f0: 300, gain: 0.45, decay: 14 });
        tone(b, { at: 0.13, length: 0.18, f0: 210, gain: 0.45, decay: 12 });
        return b;
    },
    // Picking up the pile: cards sliding in one after another.
    pickup() {
        const b = samples(0.55);
        for (let i = 0; i < 7; i++) hiss(b, { at: i * 0.065, length: 0.07, gain: 0.45 - i * 0.04, smooth: 0.5, decay: 40 });
        return b;
    },
    // The pile burns: a swelling whoosh with a few crackles.
    burn() {
        const b = samples(0.8);
        hiss(b, { length: 0.75, gain: 0.55, smooth: 0.85, swell: true });
        for (let i = 0; i < 9; i++) hiss(b, { at: 0.1 + random() * 0.55, length: 0.015, gain: 0.35, smooth: 0.1, decay: 200 });
        return b;
    },
    // Someone won: a bright rising arpeggio.
    win() {
        const b = samples(1.1);
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
            tone(b, { at: i * 0.11, length: 0.9 - i * 0.1, f0: f, gain: 0.32, decay: 4 });
            tone(b, { at: i * 0.11, length: 0.5, f0: f * 2, gain: 0.06, decay: 8 });
        });
        return b;
    },
    // An Ace calls a player: a two-note bell.
    call() {
        const b = samples(0.7);
        tone(b, { length: 0.5, f0: 880, gain: 0.35, decay: 7 });
        tone(b, { at: 0.16, length: 0.5, f0: 1174.66, gain: 0.35, decay: 7 });
        return b;
    },
};

fs.mkdirSync(outDir, { recursive: true });
for (const [name, make] of Object.entries(sounds)) {
    writeWav(name, make());
    console.log(`assets/sounds/${name}.wav`);
}
