import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { ChatMessage, User } from '../../../app/types';
import { SocketContext } from '../../../hooks/useApp';
import Button from '../../util/Button';

type ChatInterfaceProps = { roomId: number; user: User };

export default function ChatInterface({ roomId, user }: ChatInterfaceProps) {
    const socket: Socket = useContext(SocketContext)!;
    const [message, setMessage] = useState<string>('');
    const [messages, setMessages] = useState<Array<ChatMessage>>([]);
    const [isDisabled, setIsDisabled] = useState<boolean>(false);

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
        };
        socket.on('message-sent', messageReceivedListener); // TODO FIX
        return () => {
            socket.off('message-sent', messageReceivedListener);
        };
    }, []);

    return (
        <>
            <div className="border grow rounded-md mb-2 bg-white h-full overflow-y-auto" id="chat-messages-box">
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
                <Button label="Send" color="blue" disabled={isDisabled} handleOnClick={() => handleOnSendMessage(message)} />
            </div>
        </>
    );
}
