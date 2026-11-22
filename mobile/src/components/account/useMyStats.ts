import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { TLeaderBoard } from '@dutch-pub/shared';

import { api } from '@/lib/api';

export type MyStats = { wins: number; rank: number } | null;

/**
 * The signed-in player's wins and rank, from the leaderboard; null while unknown or when they
 * have no wins yet. Reloaded whenever the screen comes into focus (a game may have ended).
 * Quiet on failure: it's a nicety on the Account tab.
 */
export function useMyStats(username: string | undefined): { stats: MyStats; loaded: boolean } {
    const [state, setState] = useState<{ stats: MyStats; loaded: boolean }>({ stats: null, loaded: false });
    useFocusEffect(
        useCallback(() => {
            if (!username) return;
            let cancelled = false;
            api.getLeaderBoard()
                .then(async res => (res.ok ? ((await res.json()) as TLeaderBoard) : []))
                .then(rows => {
                    const mine = Array.isArray(rows) ? rows.find(row => row.winner === username) : undefined;
                    if (!cancelled) setState({ stats: mine ? { wins: mine.wins, rank: mine.rank } : null, loaded: true });
                })
                .catch(() => {});
            return () => {
                cancelled = true;
            };
        }, [username]),
    );
    return state;
}
