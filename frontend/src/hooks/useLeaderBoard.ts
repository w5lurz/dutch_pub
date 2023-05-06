import { useEffect, useState } from 'react';
import { getLeaderBoard } from '../app/api';
import { setToast } from '../app/generalSlice';
import { useAppDispatch } from '../app/hooks';
import { TLeaderBoard } from '../app/types';

export default function useLeaderBoard() {
    const [status, setStatus] = useState<string>('idle');
    const [leaderBoardData, setLeaderBoardData] = useState<TLeaderBoard>([]);

    const dispatch = useAppDispatch();

    useEffect(() => {
        (async () => {
            setStatus('fetching');
            try {
                const response = await getLeaderBoard();
                const responseInJson = await response.json();
                if (response.status === 404) {
                    console.warn(responseInJson.message);
                } else {
                    setLeaderBoardData(responseInJson);
                }
                setStatus('fetched');
            } catch (e: any) {
                console.error('Cannot fetch leaderboard data!', e.toString());
                dispatch(
                    setToast({
                        id: 'fetch-leaderboard-data-failed',
                        type: 'error',
                        message: 'Cannot get Leaderboard data!',
                        duration: 3000,
                    }),
                );
                setStatus('error');
            }
        })();
    }, []);

    return { status, leaderBoardData };
}
