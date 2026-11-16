import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';

import gameReducer from './gameSlice';
import generalReducer from './generalSlice';
import roomsReducer from './roomsSlice';
import userReducer from './userSlice';

export const store = configureStore({
    reducer: {
        user: userReducer,
        rooms: roomsReducer,
        game: gameReducer,
        general: generalReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
