import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@dutch-pub/shared';

const userSlice = createSlice({
    name: 'user',
    initialState: null as User,
    reducers: {
        setUser(_state, action: PayloadAction<User>) {
            return action.payload;
        },
        setInGame(state, action: PayloadAction<number | undefined>) {
            if (state) {
                state.inGame = action.payload;
            }
        },
    },
});

export const { setUser, setInGame } = userSlice.actions;
export default userSlice.reducer;
