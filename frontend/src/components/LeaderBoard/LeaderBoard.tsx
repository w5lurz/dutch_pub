import LeaderBoardTable from './LeaderBoardTable';

export default function LeaderBoard() {
    return (
        <div className="bg-gray-50 dark:bg-gray-900 h-full">
            <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-auto lg:py-8 gap-4">
                <h2 className="text-lg">Leaderboard</h2>
                <LeaderBoardTable />
            </div>
        </div>
    );
}
