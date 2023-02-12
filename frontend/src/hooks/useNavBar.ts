import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../app/api';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { RootState } from '../app/store';
import { setUser } from '../app/userSlice';

export default function useNavBar() {
    let navigate = useNavigate();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state: RootState) => state.user);

    const handleLogout = async () => {
        try {
            await logoutUser();
            dispatch(setUser(null));
            navigate('/');
        } catch (e: any) {
            console.error(e.toString());
        }
    };
    return { user, handleLogout };
}
