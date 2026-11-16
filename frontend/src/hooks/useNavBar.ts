import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../app/api';
import { setToast } from '../app/generalSlice';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { RootState } from '../app/store';
import { setUser } from '../app/userSlice';
import { reconnectSocket, SocketContext } from './useApp';

export default function useNavBar() {
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

    let navigate = useNavigate();
    const dispatch = useAppDispatch();
    const socket = useContext(SocketContext);
    const user = useAppSelector((state: RootState) => state.user);

    const handleLogout = async () => {
        try {
            await logoutUser();
            dispatch(setUser(null));
            reconnectSocket(socket);
            dispatch(setToast({ id: 'logout-success', type: 'success', message: 'You successfully logged out!', duration: 3000 }));
            navigate('/');
        } catch (e: any) {
            console.error(e.toString()); // TODO TEST ME
            dispatch(setToast({ id: 'login-failed', type: 'error', message: e.toString(), duration: 3000 }));
        }
    };

    const handleHamburgerOnClick = () => {
        setIsMenuOpen(isOpen => !isOpen);
    };

    return { user, isMenuOpen, handleHamburgerOnClick, handleLogout };
}
