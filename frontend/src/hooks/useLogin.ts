import { useNavigate } from 'react-router-dom';
import { loginUser } from '../app/api';
import { useAppDispatch } from '../app/hooks';
import { setUser } from '../app/userSlice';

export default function useLogin() {
    let navigate = useNavigate();
    const dispatch = useAppDispatch();

    const handleSubmit = async (event: any) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);

        const response = await loginUser(data.get('username') as string, data.get('password') as string);
        if (response.status === 200) {
            const userData = await response.json();
            console.log(userData);
            dispatch(
                // TODO what to set, nothing needed
                setUser({
                    id: userData.id,
                    username: userData.username,
                    email: userData.email,
                }),
            );
            // dispatch(setIsSnackbarOpen({ isSnackbarOpen: true, snackbarText: 'Sikeres bejelentkezés!' }));
            navigate('/');
        } else {
            console.log('nooononono');
            // dispatch(setIsSnackbarOpen({ isSnackbarOpen: true, snackbarText: 'Hiba a bejelentkezés során!', severity: 'error' }));
        }
    };

    return { handleSubmit };
}
