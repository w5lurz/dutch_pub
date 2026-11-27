import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AvatarId, User } from '@dutch-pub/shared';

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
        /** The chosen avatar (null: generated from the name). Registered users only. */
        setAvatar(state, action: PayloadAction<AvatarId | null>) {
            if (state && !state.isGuest) {
                state.avatar = action.payload;
            }
        },
    },
});

export const { setUser, setInGame, setAvatar } = userSlice.actions;
export default userSlice.reducer;
