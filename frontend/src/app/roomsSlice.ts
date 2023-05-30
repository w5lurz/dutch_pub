import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { TRooms } from './types';

const initialState: TRooms = {};

type SetRoomsActionPayload = TRooms;

const roomsSlice = createSlice({
    name: 'rooms',
    initialState: initialState,
    reducers: {
        setRooms(state, action: PayloadAction<SetRoomsActionPayload>) {
            return action.payload;
        },
    },
});

export const { setRooms } = roomsSlice.actions;
export default roomsSlice.reducer;
