import { useNavigate } from 'react-router-dom';
import { setToast } from '../app/generalSlice';
import { useAppDispatch } from '../app/hooks';

export default function useRegistration() {
    let navigate = useNavigate();
    const dispatch = useAppDispatch();

    const handleSubmit = async (event: any) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);

        const response = await fetch('http://localhost:3030/api/auth/signup', {
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, *same-origin, omit
            headers: {
                'Content-Type': 'application/json',
                // 'Content-Type': 'application/x-www-form-urlencoded',
            },
            redirect: 'follow', // manual, *follow, error
            referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
            body: JSON.stringify({
                username: data.get('username'),
                email: data.get('email'),
                password: data.get('password'),
            }), // body data type must match "Content-Type" header
        });

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
    };

    return { handleSubmit };
}
