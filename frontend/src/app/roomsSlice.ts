import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { TRooms } from './types';

const initialState: TRooms = {};

type AddActionPayload = { name: string; owner: string; slots: number };

const roomsSlice = createSlice({
    name: 'rooms',
    initialState: initialState,
    reducers: {
        addRoom(state, action: PayloadAction<AddActionPayload>) {
            const stateCopy = { ...state };
            const newKey = +(Object.keys(stateCopy)[Object.keys(stateCopy).length - 1] + 1);
            stateCopy[newKey] = { ...action.payload, players: [action.payload.owner] };
            return state;
        },
        removeRoom(state, action: PayloadAction<number>) {
            const stateCopy = { ...state };
            const { [action.payload]: deletedKey, ...rest } = stateCopy;
            return rest;
        },
        updateRoom() {},
    },
});

export const { addRoom } = roomsSlice.actions;
export default roomsSlice.reducer;
