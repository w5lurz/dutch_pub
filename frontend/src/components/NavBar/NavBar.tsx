import { NavLink } from 'react-router-dom';
import useNavBar from '../../hooks/useNavBar';
import { DutchPubLogo, hamburgerButton } from '../util/UtilComponents';
import { User } from '../../app/types';

const calcClasses = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'text-white text-base font-medium rounded-md bg-gray-800 px-3 py-1' : 'text-base font-medium text-gray-300 px-3 py-1';

const MenuItems = ({ user, handleLogout }: { user: User; handleLogout: () => Promise<void> }) => (
    <ul className="flex flex-col font-medium mt-4 md:flex-row md:space-x-8 md:mt-0 md:border-0 md:bg-transparent border-gray-700">
        {!user?.inGame && (
            <NavLink to="/play" className={calcClasses}>
                Play
            </NavLink>
        )}
        {!user?.inGame && (
            <NavLink to="/leaderboard" className={calcClasses}>
                Leaderboard
            </NavLink>
        )}
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
    </ul>
);

export default function NavBar() {
    const { user, isMenuOpen, handleHamburgerOnClick, handleLogout } = useNavBar();

    return (
        <nav className="bg-gray-700 w-full fixed top-0 left-0 z-50">
            <div className="bg-gray-700 p-2 px-4 flex flex-wrap items-center justify-between basis-auto text-gray-700 mx-auto">
                {user?.inGame ? (
                    <div className="mx-4">
                        <DutchPubLogo />
                    </div>
                ) : (
                    <NavLink to="/" className="mx-4">
                        <DutchPubLogo />
                    </NavLink>
                )}
                {!user?.inGame && hamburgerButton(handleHamburgerOnClick)}
                <div className={`${isMenuOpen ? '' : 'hidden '}w-full md:block md:w-auto`}>
                    <MenuItems user={user} handleLogout={handleLogout} />
                </div>
            </div>
        </nav>
    );
}
