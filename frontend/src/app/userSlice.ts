import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { User } from './types';

const initialState: User = null;

const userSlice = createSlice({
    name: 'user',
    initialState: initialState as User,
    reducers: {
        setUser(state, action: PayloadAction<User>) {
            const newState = action.payload;
            // ez most igy jo?
            return newState;
        },
    },
});

export const { setUser } = userSlice.actions;
export default userSlice.reducer;
