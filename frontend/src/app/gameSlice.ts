import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { Game } from './types';

export const initialState: Game = {
    userCards: { hand: [], table: 3, tableFlipped: [] },
    opponents: {},
    deck: 34,
    laidCards: null,
    burntCards: null,
};

type UpdateGamePayload = Game;

const gameSlice = createSlice({
    name: 'game',
    initialState: initialState,
    reducers: {
        updateGame(state, action: PayloadAction<UpdateGamePayload>) {
            const newState = action.payload;
            return newState;
        },
    },
});

export const { updateGame } = gameSlice.actions;
export default gameSlice.reducer;
