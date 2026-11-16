import { useCallback } from 'react';
import type { AuthResponse } from '@dutch-pub/shared';

import { api } from '@/lib/api';
import { clearToken, getToken, setToken } from '@/lib/authToken';
import { useSocket } from '@/providers/SocketProvider';
import { useAppDispatch } from '@/store';
import { setUser } from '@/store/userSlice';

type Result = { ok: true } | { ok: false; message: string };

const errorMessage = async (res: Response, fallback: string) => {
    try {
        return ((await res.json()) as { message?: string }).message ?? fallback;
    } catch {
        return fallback;
    }
};

/**
 * Login / guest / logout / restore for the mobile app (token based, see PLAN.md Step 3).
 * Each change reconnects the socket so the server sees the new identity.
 */
export function useSession() {
    const dispatch = useAppDispatch();
    const { reconnect } = useSocket();

    const startSession = useCallback(
        async (auth: AuthResponse) => {
            await setToken(auth.token);
            dispatch(setUser({ id: auth.id, username: auth.username, email: auth.email, isGuest: auth.isGuest }));
            reconnect();
        },
        [dispatch, reconnect],
    );

    const logIn = useCallback(
        async (username: string, password: string): Promise<Result> => {
            try {
                const res = await api.loginUser(username, password);
                if (!res.ok) return { ok: false, message: await errorMessage(res, 'Error while logging in!') };
                await startSession((await res.json()) as AuthResponse);
                return { ok: true };
            } catch {
                return { ok: false, message: 'Cannot reach the server.' };
            }
        },
        [startSession],
    );

    const joinAsGuest = useCallback(
        async (username: string): Promise<Result> => {
            try {
                const res = await api.addGuest(username);
                if (!res.ok) return { ok: false, message: await errorMessage(res, 'Cannot add Guest!') };
                await startSession((await res.json()) as AuthResponse);
                return { ok: true };
            } catch {
                return { ok: false, message: 'Cannot reach the server.' };
            }
        },
        [startSession],
    );

    const logOut = useCallback(async () => {
        await clearToken();
        dispatch(setUser(null));
        reconnect();
        // Nothing to invalidate server-side for bearer tokens; this only clears a web cookie.
        api.logoutUser().catch(() => {});
    }, [dispatch, reconnect]);

    /** On app start: if a token is stored, load the user it belongs to (or drop the token). */
    const restoreSession = useCallback(async () => {
        if (!(await getToken())) return;
        try {
            const res = await api.getUser();
            if (res.ok) {
                dispatch(setUser(await res.json()));
            } else if (res.status === 401 || res.status === 403 || res.status === 404) {
                await clearToken();
            }
        } catch {
            // Offline: keep the token and try again next start.
        }
    }, [dispatch]);

    return { logIn, joinAsGuest, logOut, restoreSession };
}
