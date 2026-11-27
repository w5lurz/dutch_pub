import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { GameEnd, GeneralState, TToast } from '@/lib/types';

const initialState: GeneralState = {
    toast: null,
    lastGameEnd: null,
    winner: null,
};

const generalSlice = createSlice({
    name: 'general',
    initialState,
    reducers: {
        setToast(state, action: PayloadAction<TToast | null>) {
            state.toast = action.payload;
        },
        /** How the last game ended (the game screen leaves to the leaderboard after a win, else to Play). */
        setLastGameEnd(state, action: PayloadAction<GameEnd | null>) {
            state.lastGameEnd = action.payload;
        },
        /** The winner of the game that just ended (the table shows a shot glass for them), or null. */
        setWinner(state, action: PayloadAction<string | null>) {
            state.winner = action.payload;
        },
    },
});

export const { setToast, setLastGameEnd, setWinner } = generalSlice.actions;
export default generalSlice.reducer;
