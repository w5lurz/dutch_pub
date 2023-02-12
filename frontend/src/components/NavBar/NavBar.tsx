import { Link } from 'react-router-dom';
import useNavBar from '../../hooks/useNavBar';

export default function NavBar() {
    const { user, handleLogout } = useNavBar();

    console.log(user, !user);
    return (
        <div className="bg-blue-400 h-10 px-2 flex gap-2 items-center justify-between">
            <div className="flex gap-2 items-center">
                <Link to="/" className="text-lg font-medium">
                    Dutch Pub
                </Link>
                <Link to="/play" className="text-md font-medium">
                    Play
                </Link>
            </div>
            <div className="flex gap-2">
                {!user && (
                    <Link to="/login" className="text-md">
                        Login
                    </Link>
                )}
                {!user && (
                    <Link to="/registration" className="text-md">
                        Registration
                    </Link>
                )}
                {user && (
                    <Link to="/" className="text-md" onClick={handleLogout}>
                        Log out
                    </Link>
                )}
            </div>
        </div>
    );
}
