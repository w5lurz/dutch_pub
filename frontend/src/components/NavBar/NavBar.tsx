import { Link } from 'react-router-dom';
import useNavBar from '../../hooks/useNavBar';
import { DutchPubLogo } from '../util/UtilComponents';

export default function NavBar() {
    const { user, handleLogout } = useNavBar();

    // TODO user smthg else instead of email
    return (
        <div className="bg-blue-400 p-2 px-4 flex gap-2 items-center justify-between sticky top-0 basis-auto h-14 z-50">
            <div className="flex gap-2 items-center">
                <Link to="/" className="mr-4">
                    <DutchPubLogo />
                </Link>
                <Link to="/play" className="text-base font-medium">
                    Play
                </Link>
                <Link to="/game" className="text-base font-medium">
                    Game
                </Link>
                <Link to="/leaderboard" className="text-base font-medium">
                    Leaderboard
                </Link>
            </div>
            <div className="flex gap-2">
                {!user?.email && (
                    <Link to="/login" className="text-base">
                        Login
                    </Link>
                )}
                {!user?.email && (
                    <Link to="/registration" className="text-base">
                        Registration
                    </Link>
                )}
                {user?.email && (
                    <Link to="/" className="text-base" onClick={handleLogout}>
                        Log out
                    </Link>
                )}
            </div>
        </div>
    );
}
