import { NavLink } from 'react-router-dom';
import useNavBar from '../../hooks/useNavBar';
import { DutchPubLogo } from '../util/UtilComponents';

export default function NavBar() {
    const { user, handleLogout } = useNavBar();

    // TODO user smthg else instead of email
    // const calcActiveClasses = (isActive: boolean): string => (isActive ? 'bg-blue-300 rounded-sm' : 'text-base font-medium');
    return (
        <div className="bg-blue-400 p-2 px-4 flex gap-2 items-center justify-between sticky top-0 basis-auto h-14 z-50 text-gray-700">
            <div className="flex gap-4 items-center">
                <NavLink to="/" className="mr-4">
                    <DutchPubLogo />
                </NavLink>
                <NavLink
                    to="/play"
                    className={({ isActive }: { isActive: boolean }) =>
                        isActive ? 'text-blue-100 text-base font-medium' : 'text-base font-medium'
                    }
                >
                    Play
                </NavLink>
                <NavLink
                    to="/game"
                    className={({ isActive }: { isActive: boolean }) =>
                        isActive ? 'text-blue-100 text-base font-medium' : 'text-base font-medium'
                    }
                >
                    Game
                </NavLink>
                <NavLink
                    to="/leaderboard"
                    className={({ isActive }: { isActive: boolean }) =>
                        isActive ? 'text-blue-100 text-base font-medium' : 'text-base font-medium'
                    }
                >
                    Leaderboard
                </NavLink>
            </div>
            <div className="flex gap-2">
                {!user?.email && (
                    <NavLink
                        to="/login"
                        className={({ isActive }: { isActive: boolean }) =>
                            isActive ? 'text-blue-100 text-base font-medium' : 'text-base font-medium'
                        }
                    >
                        Login
                    </NavLink>
                )}
                {!user?.email && (
                    <NavLink
                        to="/registration"
                        className={({ isActive }: { isActive: boolean }) =>
                            isActive ? 'text-blue-100 text-base font-medium' : 'text-base font-medium'
                        }
                    >
                        Registration
                    </NavLink>
                )}
                {user?.email && (
                    <NavLink
                        to="/"
                        className={({ isActive }: { isActive: boolean }) =>
                            isActive ? 'text-blue-100 text-base font-medium' : 'text-base font-medium'
                        }
                        onClick={handleLogout}
                    >
                        Log out
                    </NavLink>
                )}
            </div>
        </div>
    );
}
