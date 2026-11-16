import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { setToast } from '../../../app/generalSlice';
import { useAppDispatch } from '../../../app/hooks';
import { ChatMessage, User } from '../../../app/types';
import { SocketContext } from '../../../hooks/useApp';
import Button from '../../util/Button';
import { ChatIcon } from '../../util/UtilComponents';

type ChatInterfaceProps = { roomId: number; user: User };

export default function ChatInterface({ roomId, user }: ChatInterfaceProps) {
    const socket = useContext(SocketContext)!;

    const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
    const [message, setMessage] = useState<string>('');
    const [messages, setMessages] = useState<Array<ChatMessage>>([]);
    const [isDisabled, setIsDisabled] = useState<boolean>(false);

    const dispatch = useAppDispatch();

    const handleOnSendMessage = (message: string) => {
        if (message) {
            socket.emit('send-message', { roomId, username: user?.username, message });
            setMessage('');
            setIsDisabled(true);
            setTimeout(() => {
                setIsDisabled(false);
            }, 3000);
        }
    };

    useEffect(() => {
        // TODO maybe get messages on first render if user redirects
        const messageReceivedListener = (roomMessages: Array<ChatMessage>) => {
            setMessages(roomMessages);
            if (!isChatOpen) {
                dispatch(
                    setToast({
                        id: 'message-received',
                        type: 'info',
                        message: 'You received a message! Open Chat to check it!',
                        duration: 3000,
                    }),
                );
            }
        };
        socket.on('message-sent', messageReceivedListener); // TODO FIX
        return () => {
            socket.off('message-sent', messageReceivedListener);
        };
    }, [isChatOpen]);

    return (
        <>
            {!isChatOpen && (
                <div className="absolute inset-y-0 left-2 bottom-2 flex items-end">
                    <button
                        type="button"
                        className="inline-flex z-30 items-center justify-center rounded-md p-2 text-blue-700 hover:bg-blue-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                        aria-controls="mobile-menu"
                        aria-expanded="false"
                        onClick={() => setIsChatOpen(true)}
                    >
                        <div className="flex gap-1">
                            <span className="hidden sm:block">Open Chat</span>
                            <ChatIcon />
                        </div>
                        <span className="sr-only">Open chat</span>
                    </button>
                </div>
            )}

            {isChatOpen && (
                <div className="p-2 basis-48 grow-0 shrink-0 shadow-md bg-gray-300 h-full">
                    <div className="flex flex-col justify-between h-full">
                        <button
                            type="button"
                            className="inline-flex gap-1 mb-2 items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            aria-controls="mobile-menu"
                            aria-expanded="false"
                            onClick={() => setIsChatOpen(false)}
                        >
                            Hide Chat
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="w-6 h-6"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div id="chat-messages-box" className="border grow rounded-md mb-2 bg-white h-full overflow-y-auto">
                            <div className="m-1 text-sm">
                                {messages.map(message => (
                                    <div key={message.id} className="flex flex-col break-words">
                                        <div className="flex items-center gap-2 justify-between">
                                            <p className="font-semibold">{message.senderName}</p>
                                            <p className="text-xs">{message.time}</p>
                                        </div>
                                        <p>{message.message}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 z-20 p-2 bg-gray-100 rounded-md">
                            <div>
                                <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Send a message
                                </label>
                                <input
                                    type="text"
                                    name="message"
                                    id="message"
                                    value={message}
                                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="type smthg..."
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
                                />
                            </div>
                            <Button
                                label="Send"
                                color="blue"
                                disabled={isDisabled || message.length === 0}
                                handleOnClick={() => handleOnSendMessage(message)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
