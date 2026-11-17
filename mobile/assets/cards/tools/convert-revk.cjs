// One-off converter: RevK "standard" SVG deck (CC0, https://www.me.uk/cards/standard/) -> TypeScript
// data modules for react-native-svg (src/components/cards/art/*.generated.ts). Not part of the build.
// usage: node convert-revk.cjs <dir with the 52 downloaded SVGs (AS.svg ... KD.svg)> <output dir>
// Reads the SVGs as text only (regex over the very regular generator output).
const fs = require('fs');
const path = require('path');

const [srcDir, outDir] = process.argv.slice(2);
const read = name => fs.readFileSync(path.join(srcDir, `${name}.svg`), 'utf8');

const SUITS = { S: 'spades', H: 'hearts', D: 'diamonds', C: 'clubs' };
const RANKS = { A: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', T: '10', J: 'J', Q: 'Q', K: 'K' };
const COLOR_TOKENS = { red: 'red', black: 'black', '#44F': 'blue', '#FC4': 'gold', white: 'white' };

const attrs = tag => {
    const out = {};
    for (const m of tag.matchAll(/([a-zA-Z:-]+)="([^"]*)"/g)) out[m[1]] = m[2];
    return out;
};
const num = v => Math.round(parseFloat(v) * 1000) / 1000;
/** Re-serialises path data with every number rounded to `digits` decimals (arc flags kept). */
const roundPath = (d, digits) => {
    const f = 10 ** digits;
    const fmt = v => {
        const r = Math.round(v * f) / f;
        return String(r === 0 ? 0 : r).replace(/^(-?)0\./, "$1.");
    };
    const out = [];
    const re = /\s*,?\s*([MmLlHhVvCcSsQqTtAaZz])|\s*,?\s*(-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?)/y;
    let cmd = null;
    let argIndex = 0;
    let pos = 0;
    while (pos < d.length) {
        if (/^\s*$/.test(d.slice(pos))) break;
        // Arc flags (4th and 5th arc arguments) are single digits that may be written without separators.
        if (cmd && /[aA]/.test(cmd) && (argIndex % 7 === 3 || argIndex % 7 === 4)) {
            const m = /^[\s,]*([01])/.exec(d.slice(pos));
            if (!m) throw new Error("bad arc flag");
            out.push(" " + m[1]);
            pos += m[0].length;
            argIndex++;
            continue;
        }
        re.lastIndex = pos;
        const m = re.exec(d);
        if (!m) throw new Error("cannot parse path at " + d.slice(pos, pos + 20));
        pos = re.lastIndex;
        if (m[1]) {
            cmd = m[1];
            argIndex = 0;
            out.push(cmd);
        } else {
            const n = fmt(parseFloat(m[2]));
            out.push(argIndex === 0 || n.startsWith("-") ? n : " " + n);
            argIndex++;
        }
    }
    return out.join("");
};

function symbols(svg) {
    const out = {};
    for (const m of svg.matchAll(/<symbol ([^>]*)>([\s\S]*?)<\/symbol>/g)) {
        const a = attrs(m[1]);
        const paths = [...m[2].matchAll(/<path ([^>]*)>/g)].map(p => attrs(p[1]));
        const uses = [...m[2].matchAll(/<use ([^>]*)>/g)].map(u => attrs(u[1]));
        out[a.id] = { ...a, paths, uses };
    }
    return out;
}

/** Card-level <use> elements after </defs>, with a flag for the rotate(180) group. */
function cardUses(svg) {
    const body = svg.slice(svg.indexOf('</defs>'));
    const out = [];
    let rotated = false;
    for (const m of body.matchAll(/<g transform="rotate\(180\)">|<\/g>|<use ([^>]*)>/g)) {
        if (m[0].startsWith('<g')) rotated = true;
        else if (m[0] === '</g>') rotated = false;
        else out.push({ ...attrs(m[1]), rotated });
    }
    return out;
}

// --- Suit and rank glyphs -------------------------------------------------------------
const suitPaths = {};
const rankPaths = {};
for (const [s, suit] of Object.entries(SUITS)) {
    const sym = symbols(read(`2${s}`))[`S${s}2`];
    suitPaths[suit] = sym.paths[0].d;
}
for (const [r, rank] of Object.entries(RANKS)) {
    const sym = symbols(read(`${r}S`))[`VS${r}`];
    rankPaths[rank] = sym.paths[0].d;
}

// --- Layouts (index, pips, court suit marks) per suit and rank (RevK nudges some pips per suit) ---
const layouts = {};
for (const [s, suit] of Object.entries(SUITS)) {
    layouts[suit] = {};
    for (const [r, rank] of Object.entries(RANKS)) {
        layouts[suit][rank] = cardUses(read(`${r}${s}`))
            .filter(u => /^#[SV][SHDC][A2-9TJQK]$/.test(u["xlink:href"]))
            // The ace of spades' big decorated pip is ACE_OF_SPADES.
            .filter(u => !(r === "A" && s === "S" && num(u.width) > 100))
            .map(u => ({
                kind: u["xlink:href"][1] === "S" ? "suit" : "rank",
                x: num(u.x),
                y: num(u.y),
                size: num(u.width),
                rotated: u.rotated,
            }));
    }
}

// Decorated ace of spades: the layered big pip (dashed ring, white ring, fill), without the QR / URL.
const aceOfSpades = cardUses(read('AS'))
    .filter(u => u['xlink:href'] === '#SSA' && num(u.width) > 100)
    .map(u => ({
        x: num(u.x),
        y: num(u.y),
        size: num(u.width),
        stroke: u.stroke ? COLOR_TOKENS[u.stroke] : undefined,
        strokeWidth: u['stroke-width'] ? num(u['stroke-width']) : undefined,
        strokeDasharray: u['stroke-dasharray'],
        strokeLinecap: u['stroke-linecap'],
    }));

// --- Court figures ---------------------------------------------------------------------
let courtFrame = null;
const courts = {};
for (const r of ['J', 'Q', 'K']) {
    for (const [s, suit] of Object.entries(SUITS)) {
        const svg = read(`${r}${s}`);
        const syms = symbols(svg);
        const layers = [];
        for (let i = 1; i <= 6; i++) {
            const sym = syms[`${s}${r}${i}`];
            if (!sym) throw new Error(`missing layer ${i} of ${r}${s}`);
            if (sym.viewBox !== '0 0 1300 2000') throw new Error('unexpected court viewBox');
            for (const p of sym.paths) {
                const layer = { d: roundPath(p.d, 1) };
                if (p.fill && p.fill !== 'none') layer.fill = COLOR_TOKENS[p.fill];
                if (p.stroke) {
                    layer.stroke = COLOR_TOKENS[p.stroke];
                    layer.strokeWidth = num(p['stroke-width']);
                }
                if ((p.fill && p.fill !== 'none' && !layer.fill) || (p.stroke && !layer.stroke)) {
                    throw new Error(`unknown colour in ${r}${s}: ${p.fill} ${p.stroke}`);
                }
                layers.push(layer);
            }
            // Suit marks drawn on the figure (e.g. on the king's robe): symbol 1200 units -> width.
            for (const u of sym.uses) {
                const scale = num(u.width) / 1200;
                const half = num(u.width) / 2;
                layers.push({
                    mark: `${u.transform.replace(/\)(?=[a-z])/g, ') ')} translate(${half} ${half}) scale(${scale})`,
                });
            }
        }
        const frame = cardUses(svg).find(u => u['xlink:href'] && /^#[SHDC][JQK][1-6]$/.test(u['xlink:href']));
        const f = { x: num(frame.x), y: num(frame.y), width: num(frame.width), height: num(frame.height) };
        if (courtFrame && JSON.stringify(courtFrame) !== JSON.stringify(f)) throw new Error('court frame differs');
        courtFrame = f;
        courts[`${RANKS[r]}-${suit}`] = layers;
    }
}

// --- Emit --------------------------------------------------------------------------------
const header = source => `// GENERATED by a one-off conversion of the RevK "standard" SVG deck (CC0, see
// mobile/assets/cards/LICENSE.md). ${source} Do not edit by hand.
`;
const compact = v =>
    JSON.stringify(v, null, 4)
        .replace(/\{\s+("kind"[^}]*?)\s+\}/g, (m, inner) => '{ ' + inner.replace(/\s+/g, ' ') + ' }')
        .replace(/"([a-zA-Z]+)":/g, '$1:');
const json = v => JSON.stringify(v, null, 4).replace(/"([a-zA-Z]+)":/g, '$1:');

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
    path.join(outDir, 'deck.generated.ts'),
    `${header('Suit / rank glyphs and pip layouts.')}
import type { CardRank, CardSuit } from '@dutch-pub/shared';

/** Suit symbol paths, drawn in a -600..600 square. */
export const SUIT_PATHS: Record<CardSuit, string> = ${json(suitPaths)};

/** Rank glyph paths (strokes, width 80), drawn in a -500..500 square. */
export const RANK_PATHS: Record<CardRank, string> = ${json(rankPaths)};

export type LayoutItem = { kind: 'suit' | 'rank'; x: number; y: number; size: number; rotated: boolean };

/**
 * Index glyphs and pips per rank, in the card's -120 -168 240 336 viewBox. \`x\` / \`y\` / \`size\`
 * are the top-left corner and size of the symbol's square; \`rotated\` items are drawn turned 180°
 * around the card centre.
 */
export const LAYOUTS: Record<CardSuit, Record<CardRank, LayoutItem[]>> = ${compact(layouts)};

export type DecoratedPip = {
    x: number;
    y: number;
    size: number;
    stroke?: 'black' | 'white';
    strokeWidth?: number;
    strokeDasharray?: string;
    strokeLinecap?: 'round';
};

/** The ace of spades' big pip, drawn as three layers (dashed ring, white ring, fill). */
export const ACE_OF_SPADES: DecoratedPip[] = ${json(aceOfSpades)};
`,
);

fs.writeFileSync(
    path.join(outDir, 'courts.generated.ts'),
    `${header('Court figures (Goodall & Son pattern, traced by RevK).')}
export type CourtColor = 'red' | 'black' | 'blue' | 'gold';

/**
 * One layer of a court figure: a path in the figure's 0 0 1300 2000 box (only the top half is
 * drawn; the figure is drawn again rotated 180°), or a suit mark (\`mark\` = transform that places
 * a -600..600 suit symbol).
 */
export type CourtLayer =
    | { d: string; fill?: CourtColor; stroke?: CourtColor; strokeWidth?: number; mark?: undefined }
    | { mark: string; d?: undefined };

/** Where the figure's 1300 x 2000 box sits in the card's -120 -168 240 336 viewBox (also the frame line). */
export const COURT_FRAME = ${json(courtFrame)};

/** Keyed "J-hearts", "Q-spades", ... */
export const COURTS: Record<string, CourtLayer[]> = ${json(courts)};
`,
);
for (const f of ['deck.generated.ts', 'courts.generated.ts']) {
    console.log(f, fs.statSync(path.join(outDir, f)).size);
}
