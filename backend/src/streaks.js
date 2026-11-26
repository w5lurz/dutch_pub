// Games in a row, per player: a game is "in a row" when it starts within STREAK_GAP_MS of the end
// of that player's previous game (won or stopped). The table shows that many empty cans (the app's
// TableCans). Kept in memory only: a server restart starts everyone from one again.

/** How long after a game the next one still counts as "in a row" (env for tests). */
const STREAK_GAP_MS = Number(process.env.STREAK_GAP_MS ?? 30 * 60 * 1000);

/** A game whose end we never saw (the player left it): treated as ended this long after its start. */
const LONGEST_GAME_MS = 2 * 60 * 60 * 1000;

/** username -> { count: games in a row so far, startedAt, endedAt: when the last one ended (null: running or left) }. */
const streaks = new Map();

/** When `streak`'s last game ended, or is taken to have ended. */
const endOf = streak => streak.endedAt ?? streak.startedAt + LONGEST_GAME_MS;

/**
 * A game starts with `usernames` (bots left out): each player's count goes up when their previous
 * game ended at most `STREAK_GAP_MS` ago, otherwise it starts again at 1. Returns the table's
 * count: the highest of them (at least 1).
 */
export const startStreaks = usernames => {
    const now = Date.now();
    let best = 1;
    for (const username of usernames) {
        const previous = streaks.get(username);
        const inARow = previous && now - endOf(previous) <= STREAK_GAP_MS;
        const count = inARow ? previous.count + 1 : 1;
        streaks.set(username, { count, startedAt: now, endedAt: null });
        best = Math.max(best, count);
    }
    return best;
};

/** A game with `usernames` ended (won or stopped): the next one has `STREAK_GAP_MS` to start. */
export const endStreaks = usernames => {
    const now = Date.now();
    for (const username of usernames) {
        const streak = streaks.get(username);
        if (streak) streak.endedAt = now;
    }
};

// Forget players whose streak can't go on any more, so the map doesn't grow with every name seen.
setInterval(() => {
    const now = Date.now();
    streaks.forEach((streak, username) => {
        if (now - endOf(streak) > STREAK_GAP_MS) streaks.delete(username);
    });
}, Math.max(60 * 1000, STREAK_GAP_MS)).unref();
