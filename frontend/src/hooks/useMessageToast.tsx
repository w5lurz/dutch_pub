import { createContext, ReactNode, RefObject, useContext, useState } from 'react';
import { MessageToastsContextType, ToastPositionType, TToast } from '../app/types';
import MessageToast from '../components/Game/components/MessageToast';
import { positionClasses } from '../components/Toast/utils';

const MessageToastsContext = createContext<MessageToastsContextType>({
    add: () => {},
    remove: () => {
        console.log('ASD');
    },
    position: 'topRight',
});

export const useMessageToast = () => useContext(MessageToastsContext);

export const MessageToastsProvider = ({ children }: { children: ReactNode }) => {
    const [messageToasts, setMessageToasts] = useState<TToast[]>([]);
    const [position, setPosition] = useState<ToastPositionType>('topRight');
    console.log('MSG TOASTS', messageToasts);
    const add = (toast: Omit<TToast, 'id'>) => {
        console.log('ADD', toast);
        //first check for position
        if (toast.position && toast.position !== position) {
            setPosition(toast.position);
        }

        // add it to the list
        setMessageToasts(toasts => [...toasts, { ...toast, id: Math.random() * 10000 }]);
    };

    const remove = (toastId: number, ref: RefObject<HTMLDivElement>) => {
        ref?.current?.classList.add('animate-toastOut');

        //remove element after animation is done
        ref?.current?.addEventListener('animationend', () => {
            // lets remove it
            setMessageToasts(toasts => toasts.filter(toast => toast.id !== toastId));
        });
    };

    return (
        <div className="flex flex-col justify-between h-full">
            <MessageToastsContext.Provider value={{ add, remove, position }}>
                {children}
                {/* message toast list */}
                <div className={positionClasses[position] + ' fixed w-screen max-w-xs z-50'}>
                    {messageToasts.map(toast => (
                        <MessageToast key={toast.id} toast={toast} remove={remove} />
                    ))}
                </div>
            </MessageToastsContext.Provider>
        </div>
    );
};
