import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../app/api';
import { setToast } from '../app/generalSlice';
import { useAppDispatch } from '../app/hooks';
import { setUser } from '../app/userSlice';

export default function useLogin() {
    const [loading, setLoading] = useState<boolean>(false);

    let navigate = useNavigate();
    const dispatch = useAppDispatch();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setLoading(true);
        try {
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
                dispatch(setToast({ id: 'login-success', type: 'success', message: 'You successfully logged in!', duration: 3000 }));
                navigate('/');
            } else {
                const userData = await response.json();
                console.error('Error while logging in ', userData?.message);
                dispatch(setToast({ id: 'login-failed', type: 'error', message: userData?.message, duration: 3000 }));
            }
        } catch (e: any) {
            console.error('Error while logging in ', e.toString());
            dispatch(setToast({ id: 'login-failed', type: 'error', message: 'Error while logging in!', duration: 3000 }));
        }
        setLoading(false);
    };

    return { loading, handleSubmit };
}
