import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import roomsReducer from './roomsSlice';
import gameReducer from './gameSlice';

export const store = configureStore({
    reducer: {
        user: userReducer,
        rooms: roomsReducer,
        game: gameReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
