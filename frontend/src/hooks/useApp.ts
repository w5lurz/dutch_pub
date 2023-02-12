import { useEffect } from 'react';
import { getUser } from '../app/api';
import { useAppDispatch } from '../app/hooks';
import { setUser } from '../app/userSlice';

export default function useApp() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        (async () => {
            try {
                // TODO 403 still stays in try
                const response = await getUser();
                const userData = await response.json();
                if (userData?.id) {
                    dispatch(setUser(userData));
                }
            } catch (e: any) {
                console.error(e.toString());
            }
        })();
    }, []);
}
