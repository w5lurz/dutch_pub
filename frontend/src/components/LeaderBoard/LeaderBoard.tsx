import LeaderBoardTable from './LeaderBoardTable';

export default function LeaderBoard() {
    return (
        <div className="flex flex-col items-center gap-4 bg-white shadow dark:border md:mt-0 xl:p-4 md:p-2 dark:bg-gray-800 dark:border-gray-700">
            <h2 className="text-lg font-semibold mt-8">Leaderboard</h2>
            <LeaderBoardTable />
        </div>
    );
}
