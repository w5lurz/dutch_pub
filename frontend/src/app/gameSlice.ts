import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { Game } from './types';

const initialState: Game = { userCards: { hand: [], table: [], tableFlipped: [] }, opponents: {} };

type UpdateGamePayload = Game;

const gameSlice = createSlice({
    name: 'game',
    initialState: initialState,
    reducers: {
        updateGame(state, action: PayloadAction<UpdateGamePayload>) {
            return action.payload;
        },
    },
});

export const { updateGame } = gameSlice.actions;
export default gameSlice.reducer;
