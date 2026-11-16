import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ChatMessage } from '@dutch-pub/shared';

/** Chat history of the room the user is in (the server always sends the full list). */
const chatSlice = createSlice({
    name: 'chat',
    initialState: [] as ChatMessage[],
    reducers: {
        setMessages(_state, action: PayloadAction<ChatMessage[]>) {
            return action.payload;
        },
    },
});

export const { setMessages } = chatSlice.actions;
export default chatSlice.reducer;
