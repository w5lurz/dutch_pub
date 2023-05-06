import useLeaderBoard from '../../hooks/useLeaderBoard';

export default function LeaderBoardTable() {
    const { status, leaderBoardData } = useLeaderBoard();
    return (
        <div className="max-w-3/4 relative overflow-auto">
            {status === 'fetching' && (
                <div role="status" className="p-4 border border-gray-200 rounded shadow animate-pulse md:p-6 dark:border-gray-700">
                    <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-32 mb-2.5"></div>
                    <div className="w-48 h-2 mb-10 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                    <div className="flex items-baseline mt-4 space-x-6">
                        <div className="w-full bg-gray-200 rounded-t-lg h-72 dark:bg-gray-700"></div>
                        <div className="w-full h-56 bg-gray-200 rounded-t-lg dark:bg-gray-700"></div>
                        <div className="w-full bg-gray-200 rounded-t-lg h-72 dark:bg-gray-700"></div>
                        <div className="w-full h-64 bg-gray-200 rounded-t-lg dark:bg-gray-700"></div>
                        <div className="w-full bg-gray-200 rounded-t-lg h-80 dark:bg-gray-700"></div>
                        <div className="w-full bg-gray-200 rounded-t-lg h-72 dark:bg-gray-700"></div>
                        <div className="w-full bg-gray-200 rounded-t-lg h-80 dark:bg-gray-700"></div>
                    </div>
                    <span className="sr-only">Loading...</span>
                </div>
            )}
            {status === 'fetched' && leaderBoardData?.length > 0 && (
                <div className="shadow-sm overflow-hidden my-8 rounded-md">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 bg-blue-300 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-center">
                                    Rank
                                </th>
                                <th scope="col" className="px-6 py-3 text-center">
                                    Wins
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Username
                                </th>
                                <th scope="col" className="px-6 py-3 hidden md:table-cell">
                                    Favourite Friend
                                </th>
                                <th scope="col" className="px-6 py-3 hidden md:table-cell">
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
                                    <td className="px-6 py-4 hidden md:table-cell">{row.favouriteFriend}</td>
                                    <td className="px-6 py-4 hidden md:table-cell">{new Date(row.latestWin).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {status === 'fetched' && leaderBoardData?.length === 0 && <p className="text-base text-center">No Games played yet!</p>}
            {status === 'error' && leaderBoardData?.length === 0 && <p className="text-base text-center">Erro fetching data!</p>}
        </div>
    );
}
