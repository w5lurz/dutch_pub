import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registration } from '../app/api';
import { setToast } from '../app/generalSlice';
import { useAppDispatch } from '../app/hooks';

export default function useRegistration() {
    const [loading, setLoading] = useState<boolean>(false);

    let navigate = useNavigate();
    const dispatch = useAppDispatch();

    const handleSubmit = async (event: any) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setLoading(true);
        try {
            const response = await registration(
                data.get('username') as string,
                data.get('email') as string,
                data.get('password') as string,
            );

            if (response.status === 201) {
                dispatch(
                    setToast({
                        id: 'registration-success',
                        type: 'success',
                        message: 'You successfully Registered your new user!',
                        duration: 3000,
                    }),
                );
                navigate('/login');
            } else {
                const userData = await response.json();
                console.error('Error while registration ', userData?.message);
                dispatch(setToast({ id: 'registration-failed', type: 'error', message: userData?.message, duration: 3000 }));
            }
        } catch (e: any) {
            console.error('Error while registration ', e.toString());
            dispatch(setToast({ id: 'registration-failed', type: 'error', message: 'Error while registration!', duration: 3000 }));
        }
        setLoading(false);
    };

    const pwOnChange = () => {
        const password = document.querySelector('input[name=password]')! as HTMLInputElement;
        const confirm = document.querySelector('input[name=confirm-password]')! as HTMLInputElement;

        if (confirm.value === password.value) {
            confirm.setCustomValidity('');
        } else {
            confirm.setCustomValidity('A jelszavak nem egyeznek!');
        }
    };

    return { loading, handleSubmit, pwOnChange };
}
