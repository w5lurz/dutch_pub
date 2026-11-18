import type { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import type { Game, TCard } from '@dutch-pub/shared';

import { useGameActions } from '../useGameActions';
import chatReducer from '@/store/chatSlice';
import gameReducer, { updateGame } from '@/store/gameSlice';
import generalReducer from '@/store/generalSlice';
import roomsReducer, { setRooms } from '@/store/roomsSlice';
import userReducer, { setUser } from '@/store/userSlice';

const mockSocket = { emit: jest.fn() };
jest.mock('@/providers/SocketProvider', () => ({
    useSocket: () => ({ socket: mockSocket, connected: true }),
}));

const card = (value: number, color = 'hearts'): TCard => ({ name: String(value), value, color });

const ROOM = 7;

async function setup(game: Partial<Game>) {
    const store = configureStore({
        reducer: { user: userReducer, rooms: roomsReducer, game: gameReducer, general: generalReducer, chat: chatReducer },
    });
    store.dispatch(setUser({ id: 1, username: 'me', inGame: ROOM }));
    store.dispatch(
        updateGame({
            userCards: { hand: [card(5), card(12)], tableFlipped: [], table: 3 },
            opponents: {},
            deck: 10,
            laidCards: [card(9)],
            burntCards: null,
            active: true,
            ...game,
        }),
    );
    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
    const hook = await renderHook(() => useGameActions(), { wrapper });
    return { store, hook };
}

beforeEach(() => mockSocket.emit.mockClear());

describe('useGameActions.layCard', () => {
    it('sends a valid move and reports it as sent', async () => {
        const { hook } = await setup({ laidCards: [card(4)] });
        let sent = false;
        await act(async () => {
            sent = hook.result.current.layCard(card(5), 0, true);
        });
        expect(sent).toBe(true);
        expect(mockSocket.emit).toHaveBeenCalledWith('lay-card', { card: card(5), cardIndex: 0, roomId: ROOM, username: 'me' });
    });

    it('refuses a card that does not fit the pile, with a toast', async () => {
        const { hook, store } = await setup({ laidCards: [card(12)] });
        let sent = true;
        await act(async () => {
            sent = hook.result.current.layCard(card(5), 0, true);
        });
        expect(sent).toBe(false);
        expect(mockSocket.emit).not.toHaveBeenCalledWith('lay-card', expect.anything());
        expect(store.getState().general.toast?.message).toBe('You cannot lay that card.');
    });

    it('refuses moves out of turn or of cards that are not playable yet', async () => {
        const { hook, store } = await setup({ active: false, laidCards: [card(4)] });
        await act(async () => {
            expect(hook.result.current.layCard(card(5), 0, true)).toBe(false);
        });
        expect(store.getState().general.toast?.message).toBe("It's not your turn yet.");

        const other = await setup({ laidCards: [card(4)] });
        await act(async () => {
            expect(other.hook.result.current.layCard(card(9), 0, false)).toBe(false);
        });
        expect(other.store.getState().general.toast?.message).toBe('You cannot place that card!');
        expect(mockSocket.emit).not.toHaveBeenCalledWith('lay-card', expect.anything());
    });
});

describe('useGameActions auto pick-up', () => {
    it('picks up the pile once when no card can be laid, also across re-renders', async () => {
        const { hook } = await setup({ userCards: { hand: [card(5)], tableFlipped: [], table: 3 }, laidCards: [card(13)] });
        await hook.rerender({});
        await hook.rerender({});
        const draws = mockSocket.emit.mock.calls.filter(([event]) => event === 'draw-cards');
        expect(draws).toEqual([['draw-cards', { roomId: ROOM, username: 'me' }]]);
    });

    it('does not pick up when a card can be laid', async () => {
        await setup({ laidCards: [card(4)] });
        expect(mockSocket.emit).not.toHaveBeenCalledWith('draw-cards', expect.anything());
    });

    it('does not pick up when it is not your turn', async () => {
        await setup({ active: false, laidCards: [card(13)] });
        expect(mockSocket.emit).not.toHaveBeenCalledWith('draw-cards', expect.anything());
    });

    it('picks up again for a new stuck state', async () => {
        const { store } = await setup({ userCards: { hand: [card(5)], tableFlipped: [], table: 3 }, laidCards: [card(13)] });
        await act(async () => {
            store.dispatch(
                updateGame({ ...store.getState().game, userCards: { hand: [card(3)], tableFlipped: [], table: 3 }, laidCards: [card(12)] }),
            );
        });
        expect(mockSocket.emit.mock.calls.filter(([event]) => event === 'draw-cards')).toHaveLength(2);
    });
});

describe('useGameActions.stopGame', () => {
    const room = (owner: string) => ({
        [ROOM]: { name: 'r', owner, players: [{ username: 'me' }, { username: 'other' }], slots: 2, socketRoomId: `game-${ROOM}`, visibility: 'public' },
    });

    it('lets the room owner stop the game', async () => {
        const { store, hook } = await setup({});
        await act(async () => {
            store.dispatch(setRooms(room('me') as never));
        });
        expect(hook.result.current.canStop).toBe(true);
        await act(async () => hook.result.current.stopGame());
        expect(mockSocket.emit).toHaveBeenCalledWith('stop-game', ROOM);
    });

    it('does nothing for the other players', async () => {
        const { store, hook } = await setup({});
        await act(async () => {
            store.dispatch(setRooms(room('other') as never));
        });
        expect(hook.result.current.canStop).toBe(false);
        await act(async () => hook.result.current.stopGame());
        expect(mockSocket.emit).not.toHaveBeenCalledWith('stop-game', expect.anything());
    });
});
