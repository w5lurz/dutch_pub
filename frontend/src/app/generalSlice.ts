import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { GeneralState, TToast } from './types';

const initialState: GeneralState = {
    toast: null,
};

type SetToastPayload = TToast | null;

const generalSlice = createSlice({
    name: 'general',
    initialState: initialState,
    reducers: {
        setToast(state, action: PayloadAction<SetToastPayload>) {
            return { ...state, toast: action.payload };
        },
    },
});

export const { setToast } = generalSlice.actions;
export default generalSlice.reducer;
