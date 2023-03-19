import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { User } from '../../../app/types';
import { SocketContext } from '../../../hooks/useApp';
import { MessageToastsProvider, useMessageToast } from '../../../hooks/useMessageToast';
import Button from '../../util/Button';

type ChatInterfaceProps = { roomId: number; user: User };

export default function ChatInterface({ roomId, user }: ChatInterfaceProps) {
    const socket: Socket = useContext(SocketContext)!;
    const { add } = useMessageToast();
    const [message, setMessage] = useState<string>('');
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
        const messageReceivedListener = (username: string, message: string) => {
            add({
                type: 'info',
                // user:  TODO ADD USER
                message: `${username} says: ${message}`,
                duration: 3000,
                position: 'topLeft',
                // icon: icon.value,
            });
        };
        socket.on('message-sent', messageReceivedListener); // TODO FIX
        return () => {
            socket.off('message-sent', messageReceivedListener);
        };
    }, []);

    return (
        <div className="absolute bottom-8 left-4 flex flex-col gap-2 z-20">
            <div>
                <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Send a message
                </label>
                <input
                    type="text"
                    name="message"
                    id="message"
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="type smthg..."
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
                />
            </div>
            <Button label="Send" color="blue" disabled={isDisabled} handleOnClick={() => handleOnSendMessage(message)} />
        </div>
    );
}
