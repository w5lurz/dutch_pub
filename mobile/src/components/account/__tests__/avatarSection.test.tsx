import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import type { User } from '@dutch-pub/shared';

import { api } from '@/lib/api';
import { useAppSelector } from '@/store';
import generalReducer from '@/store/generalSlice';
import userReducer, { setUser } from '@/store/userSlice';
import { AvatarSection } from '../AvatarSection';

jest.mock('@/lib/api', () => ({ api: { setAvatar: jest.fn() } }));
const setAvatarApi = api.setAvatar as jest.Mock;

/** The section for the store's user (re-rendered as the store changes). */
function Connected() {
    const user = useAppSelector(state => state.user);
    return user ? <AvatarSection user={user} /> : null;
}
const Section = ({ store }: { store: ReturnType<typeof makeStore> }) => (
    <Provider store={store}>
        <Connected />
    </Provider>
);
let currentStore: ReturnType<typeof makeStore>;
const makeStore = (user: User) => {
    const store = configureStore({ reducer: { user: userReducer, general: generalReducer } });
    store.dispatch(setUser(user));
    return store;
};

describe('AvatarSection', () => {
    beforeEach(() => setAvatarApi.mockReset());

    it('saves a chosen avatar and shows it at once', async () => {
        setAvatarApi.mockResolvedValue({ ok: true, json: async () => ({ avatar: 'tiger' }) });
        currentStore = makeStore({ id: 1, username: 'anna', avatar: null });
        await render(<Section store={currentStore} />);
        await fireEvent.press(screen.getByRole('button', { name: 'Change avatar' }));
        await fireEvent.press(screen.getByRole('radio', { name: 'Tiger' }));
        expect(currentStore.getState().user?.avatar).toBe('tiger');
        await waitFor(() => expect(setAvatarApi).toHaveBeenCalledWith('tiger'));
        expect(screen.getByLabelText('Your avatar: Tiger avatar')).toBeTruthy();
    });

    it('puts the old one back when saving fails', async () => {
        setAvatarApi.mockResolvedValue({ ok: false, json: async () => ({ message: 'Unknown avatar.' }) });
        currentStore = makeStore({ id: 1, username: 'anna', avatar: 'cow' });
        await render(<Section store={currentStore} />);
        await fireEvent.press(screen.getByRole('button', { name: 'Change avatar' }));
        await fireEvent.press(screen.getByRole('radio', { name: 'Tiger' }));
        await waitFor(() => expect(currentStore.getState().general.toast?.message).toBe('Unknown avatar.'));
        expect(currentStore.getState().user?.avatar).toBe('cow');
    });

    it('shows guests their generated avatar without a picker', async () => {
        currentStore = makeStore({ id: 2, username: 'guest', isGuest: true });
        await render(<Section store={currentStore} />);
        expect(screen.getByText('Your avatar is generated from your name. Logged-in players can choose one.')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Change avatar' })).toBeNull();
        expect(screen.getByLabelText(/generated from the name/)).toBeTruthy();
    });
});
