import type { TLeaderBoard } from '@dutch-pub/shared';
import { useCallback, useEffect, useRef, useState } from 'react';

import { api } from '@/lib/api';
import i18n from '@/i18n';
import { useAppDispatch } from '@/store';
import { setToast } from '@/store/generalSlice';

export type LeaderBoardStatus = 'idle' | 'loading' | 'refreshing' | 'loaded' | 'empty' | 'error';

/**
 * How a fetch was triggered:
 * - `pull`: pull-to-refresh, shows the RefreshControl spinner.
 * - `background`: first load, retry, tab focus. Shows the full-screen spinner only when
 *   there are no rows yet; otherwise keeps the current list on screen while fetching.
 */
type FetchMode = 'pull' | 'background';

export type UseLeaderBoardResult = {
    status: LeaderBoardStatus;
    data: TLeaderBoard;
    /** Pull-to-refresh: refetch while keeping the current rows visible. */
    refresh: () => void;
    /** Refetch; spinner only when no rows are shown yet (first load, retry, tab focus). */
    reload: () => void;
};

export function useLeaderBoard(): UseLeaderBoardResult {
    const dispatch = useAppDispatch();
    const [status, setStatus] = useState<LeaderBoardStatus>('idle');
    const [data, setData] = useState<TLeaderBoard>([]);

    // Ignore responses from superseded requests and after unmount.
    const requestId = useRef(0);
    const hasData = useRef(false);
    useEffect(() => {
        hasData.current = data.length > 0;
    }, [data]);
    useEffect(
        () => () => {
            requestId.current += 1;
        },
        [],
    );

    const load = useCallback(
        async (mode: FetchMode) => {
            const id = ++requestId.current;
            if (mode === 'pull') setStatus('refreshing');
            else if (!hasData.current) setStatus('loading');

            try {
                const response = await api.getLeaderBoard();
                const body: unknown = await response.json();
                if (id !== requestId.current) return;

                if (response.status === 404) {
                    setData([]);
                    setStatus('empty');
                    return;
                }
                if (!response.ok || !Array.isArray(body)) {
                    throw new Error(`Unexpected leaderboard response (${response.status})`);
                }
                const rows = body as TLeaderBoard;
                setData(rows);
                setStatus(rows.length > 0 ? 'loaded' : 'empty');
            } catch (e) {
                if (id !== requestId.current) return;
                console.error('Cannot fetch leaderboard data!', String(e));
                dispatch(
                    setToast({
                        id: 'fetch-leaderboard-data-failed',
                        type: 'error',
                        message: i18n.t('leaderboard.fetchFailed'),
                        duration: 3000,
                    }),
                );
                // Keep showing stale rows if we have them; otherwise show the error state.
                setStatus(hasData.current ? 'loaded' : 'error');
            }
        },
        [dispatch],
    );

    const refresh = useCallback(() => void load('pull'), [load]);
    const reload = useCallback(() => void load('background'), [load]);

    return { status, data, refresh, reload };
}

export default useLeaderBoard;
