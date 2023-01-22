// import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
// import { setUser } from '../../user/userSlice';

export default function useLogin() {
    let navigate = useNavigate();
    // const dispatch = useDispatch();

    const handleSubmit = async (event: any) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);

        const response = await fetch('http://localhost:3030/api/auth/login', {
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
            body: JSON.stringify({ username: data.get('username'), password: data.get('password') }), // body data type must match "Content-Type" header
        });
        if (response.status === 200) {
            const userData = await response.json();
            /* dispatch(
                setUser({
                    id: userData.user.id,
                    fullName: userData.user.fullname,
                    email: userData.user.email,
                    accessToken: userData.accessToken,
                }),
            ); */
            console.log(userData);
            // sessionStorage.setItem('token', data.token);
            // dispatch(setIsSnackbarOpen({ isSnackbarOpen: true, snackbarText: 'Sikeres bejelentkezés!' }));
            navigate('/');
        } else {
            console.log('nooononono');
            // dispatch(setIsSnackbarOpen({ isSnackbarOpen: true, snackbarText: 'Hiba a bejelentkezés során!', severity: 'error' }));
        }
    };

    return { handleSubmit };
}
