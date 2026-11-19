import { useCallback } from 'react';
import type { AuthResponse } from '@dutch-pub/shared';

import { api } from '@/lib/api';
import { clearToken, getToken, setToken } from '@/lib/authToken';
import { endSession } from '@/lib/session';
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
 * Login / registration / guest / logout / restore for the mobile app (token based, see PLAN.md Step 3).
 * Each change reconnects the socket so the server sees the new identity.
 */
export function useSession() {
    const dispatch = useAppDispatch();
    const { reconnect } = useSocket();

    const startSession = useCallback(
        async (auth: AuthResponse) => {
            await setToken(auth.token, auth.refreshToken);
            dispatch(setUser({ id: auth.id, username: auth.username, email: auth.email, isGuest: auth.isGuest, avatar: auth.avatar ?? null }));
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

    /** Creates a registered user. No session is started: the user logs in afterwards, as before. */
    const register = useCallback(async (username: string, email: string, password: string): Promise<Result> => {
        try {
            const res = await api.registration(username, email, password);
            if (res.status !== 201) return { ok: false, message: await errorMessage(res, 'Error while registration!') };
            return { ok: true };
        } catch {
            return { ok: false, message: 'Cannot reach the server.' };
        }
    }, []);

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
        // Revokes the refresh token on the server and forgets both tokens.
        await endSession();
        dispatch(setUser(null));
        reconnect();
    }, [dispatch, reconnect]);

    /** On app start: if a token is stored, load the user it belongs to (refreshing an expired token first; or drop it). */
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

    return { logIn, register, joinAsGuest, logOut, restoreSession };
}
