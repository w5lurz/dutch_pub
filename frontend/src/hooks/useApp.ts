import { useEffect } from 'react';

export default function useApp() {
    useEffect(() => {
        (async () => {
            const token = sessionStorage.getItem('token');
            console.log('TOKEN', token);
            const response = await fetch('http://localhost:3030/api/users/user', {
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors', // no-cors, *cors, same-origin
                cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                credentials: 'same-origin', // include, *same-origin, omit
            });
            const userData = await response.json();
            console.log('ASD', response, userData, 'HHEHE');
        })();
    }, []);
}
