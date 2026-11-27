import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TRooms } from '@dutch-pub/shared';

const roomsSlice = createSlice({
    name: 'rooms',
    initialState: {} as TRooms,
    reducers: {
        setRooms(_state, action: PayloadAction<TRooms>) {
            return action.payload;
        },
    },
});

export const { setRooms } = roomsSlice.actions;
export default roomsSlice.reducer;
