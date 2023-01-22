import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type User = {
    id: number;
    username: string;
    email: string;
    accessToken: string;
} | null;

const initialState: User = null;

const userSlice = createSlice({
    name: 'user',
    initialState: initialState as User,
    reducers: {
        setUser(state, action: PayloadAction<User>) {
            state = action.payload;
        },
    },
});

export const { setUser } = userSlice.actions;
export default userSlice.reducer;
