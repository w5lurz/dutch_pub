import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { TRooms } from './types';

const initialState: TRooms = {};

type SetRoomsActionPayload = TRooms;

const roomsSlice = createSlice({
    name: 'rooms',
    initialState: initialState,
    reducers: {
        /* addRoom(state, action: PayloadAction<AddActionPayload>) {
            const stateCopy = { ...state };
            const newKey = +(Object.keys(stateCopy)[Object.keys(stateCopy).length - 1] + 1);
            stateCopy[newKey] = {
                ...action.payload,
                players: [{ username: action.payload.owner.username, socketId: action.payload.owner.socketId }],
            };
            return state;
        },
        removeRoom(state, action: PayloadAction<number>) {
            const stateCopy = { ...state };
            const { [action.payload]: deletedKey, ...rest } = stateCopy;
            return rest;
        }, */
        setRooms(state, action: PayloadAction<SetRoomsActionPayload>) {
            return action.payload;
        },
    },
});

export const { setRooms } = roomsSlice.actions;
export default roomsSlice.reducer;
