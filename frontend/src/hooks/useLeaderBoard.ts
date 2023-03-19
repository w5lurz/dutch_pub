import { useEffect, useState } from 'react';
import { getLeaderBoard } from '../app/api';
import { TLeaderBoard } from '../app/types';

export default function useLeaderBoard() {
    const [leaderBoardData, setLeaderBoardData] = useState<TLeaderBoard>([]);

    useEffect(() => {
        (async () => {
            try {
                const response = await getLeaderBoard();
                const responseInJson = await response.json();
                if (response.status === 404) {
                    console.warn(responseInJson.message);
                } else {
                    setLeaderBoardData(responseInJson);
                }
            } catch (e: any) {
                console.error(e.toString());
            }
        })();
    }, []);

    return { leaderBoardData };
}
