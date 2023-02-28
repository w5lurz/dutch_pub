import { Link } from 'react-router-dom';
import useNavBar from '../../hooks/useNavBar';

export default function NavBar() {
    const { user, handleLogout } = useNavBar();

    // TODO user smthg else instead of email
    return (
        <div className="bg-blue-400 p-2 flex gap-2 items-center justify-between sticky top-0">
            <div className="flex gap-2 items-center">
                <Link to="/" className="text-lg font-medium">
                    Dutch Pub
                </Link>
                <Link to="/play" className="text-md font-medium">
                    Play
                </Link>
                <Link to="/game" className="text-md font-medium">
                    Game
                </Link>
            </div>
            <div className="flex gap-2">
                {!user?.email && (
                    <Link to="/login" className="text-md">
                        Login
                    </Link>
                )}
                {!user?.email && (
                    <Link to="/registration" className="text-md">
                        Registration
                    </Link>
                )}
                {user?.email && (
                    <Link to="/" className="text-md" onClick={handleLogout}>
                        Log out
                    </Link>
                )}
            </div>
        </div>
    );
}
