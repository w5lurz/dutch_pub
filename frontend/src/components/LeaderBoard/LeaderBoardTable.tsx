import useLeaderBoard from '../../hooks/useLeaderBoard';

export default function LeaderBoardTable() {
    const { leaderBoardData } = useLeaderBoard();
    return (
        <div className="relative overflow-auto">
            {leaderBoardData && leaderBoardData.length > 0 ? (
                <div className="shadow-sm overflow-hidden my-8 rounded-md">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 bg-green-100 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">
                                    Rank
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Wins
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Username
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Favourite Friend
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Latest win
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                            {leaderBoardData.map(row => (
                                <tr key={row.winner}>
                                    <th className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white text-center">
                                        #{row.rank}
                                    </th>
                                    <td className="px-6 py-4 text-center">{row.wins}</td>
                                    <td className="px-6 py-4 font-medium">{row.winner}</td>
                                    <td className="px-6 py-4">{row.favouriteFriend}</td>
                                    <td className="px-6 py-4">{new Date(row.latestWin).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-base">No Games played yet!</p>
            )}
        </div>
    );
}
