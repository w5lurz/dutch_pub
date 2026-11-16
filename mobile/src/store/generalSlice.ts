import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { GeneralState, TToast } from '@/lib/types';

const initialState: GeneralState = {
    toast: null,
};

const generalSlice = createSlice({
    name: 'general',
    initialState,
    reducers: {
        setToast(state, action: PayloadAction<TToast | null>) {
            state.toast = action.payload;
        },
    },
});

export const { setToast } = generalSlice.actions;
export default generalSlice.reducer;
