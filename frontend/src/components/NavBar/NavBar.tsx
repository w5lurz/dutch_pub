import { NavLink } from 'react-router-dom';
import useNavBar from '../../hooks/useNavBar';
import { DutchPubLogo } from '../util/UtilComponents';

const calcClasses = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'text-white text-base font-medium rounded-md bg-gray-800 px-3 py-1' : 'text-base font-medium text-gray-300 px-3 py-1';

export default function NavBar() {
    const { user, handleLogout } = useNavBar();

    // TODO user smthg else instead of email
    // const calcActiveClasses = (isActive: boolean): string => (isActive ? 'bg-blue-300 rounded-sm' : 'text-base font-medium');
    return (
        <div className="bg-gray-700 p-2 px-4 flex gap-2 items-center justify-between sticky top-0 basis-auto h-14 z-50 text-gray-700">
            <div className="flex space-x-4 items-center justify-center">
                {user?.inGame ? (
                    <div className="mx-4">
                        <DutchPubLogo />
                    </div>
                ) : (
                    <NavLink to="/" className="mx-4">
                        <DutchPubLogo />
                    </NavLink>
                )}
                {!user?.inGame && (
                    <NavLink to="/play" className={calcClasses}>
                        Play
                    </NavLink>
                )}
                {!user?.inGame && (
                    <NavLink to="/game" className={calcClasses}>
                        Game
                    </NavLink>
                )}
                {!user?.inGame && (
                    <NavLink to="/leaderboard" className={calcClasses}>
                        Leaderboard
                    </NavLink>
                )}
            </div>
            <div className="flex gap-6">
                {!user?.email && !user?.inGame && (
                    <NavLink to="/login" className={calcClasses}>
                        Login
                    </NavLink>
                )}
                {!user?.email && !user?.inGame && (
                    <NavLink to="/registration" className={calcClasses}>
                        Registration
                    </NavLink>
                )}
                {user?.email && !user?.inGame && (
                    <NavLink to="/" className="text-base font-medium text-gray-300 px-3 py-1" onClick={handleLogout}>
                        Log out
                    </NavLink>
                )}
            </div>
        </div>
    );
}
