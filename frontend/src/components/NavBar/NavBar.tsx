import { Link } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { RootState } from '../../app/store';

export default function NavBar() {
    const user = useAppSelector((state: RootState) => state.user);
    console.log(user);
    return (
        <div className="bg-blue-400 h-10 px-2 flex gap-2 items-center">
            <Link to="/" className="text-lg font-medium">
                Dutch Pub
            </Link>
            {!user && (
                <Link to="/registration" className="text-md">
                    Registration
                </Link>
            )}
            {!user && (
                <Link to="/login" className="text-md">
                    Login
                </Link>
            )}
            {user && (
                <Link to="/" className="text-md" onClick={() => console.log('LOGOUT')}>
                    Logout
                </Link>
            )}
        </div>
    );
}
