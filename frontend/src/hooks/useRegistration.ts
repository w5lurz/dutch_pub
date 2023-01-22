import { useNavigate } from 'react-router-dom';
// import { useDispatch } from 'react-redux';
// import { setIsSnackbarOpen } from '../../general/generalSlice';

export default function useRegistration() {
    let navigate = useNavigate();
    // const dispatch = useDispatch();

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
            console.log('SUCCESSFUL LOGIN');
            // dispatch(setIsSnackbarOpen({ isSnackbarOpen: true, snackbarText: 'Sikeres regisztráció!' }));
            navigate('/login');
        } else {
            console.error('nonono');
            // dispatch(setIsSnackbarOpen({ isSnackbarOpen: true, snackbarText: 'Hiba a regisztráció során!', severity: 'error' }));
        }
    };

    return { handleSubmit };
}
