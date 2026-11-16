import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Game } from '@dutch-pub/shared';

export const initialState: Game = {
    userCards: { hand: [], table: 3, tableFlipped: [] },
    opponents: {},
    deck: 34,
    laidCards: null,
    burntCards: null,
};

const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        updateGame(_state, action: PayloadAction<Game>) {
            return action.payload;
        },
    },
});

export const { updateGame } = gameSlice.actions;
export default gameSlice.reducer;
