import { useEffect, useRef } from 'react';
import { ToastPositionType, TToast } from '../../../app/types';
import { useMessageToast } from '../../../hooks/useMessageToast';
import { animationVariables, wrapperClasses } from '../../Toast/utils';

export default function MessageToast({ toast, remove }: { toast: TToast; remove: any }) {
    console.log('TOAST', toast);
    let { type = 'info', /* icon = '', */ message = '---', id, duration = 3000 } = toast;
    // icon = icon === '' ? getIcon(type) : icon;
    duration = typeof duration === 'string' ? +duration : duration;

    const wrapperRef = useRef<HTMLDivElement>(null);
    const { position } = useMessageToast();

    //auto dismiss
    const dismissRef = useRef<ReturnType<typeof setTimeout>>();
    useEffect(() => {
        if (duration) {
            dismissRef.current = setTimeout(() => {
                console.log('USEEFFECT');
                remove(id, wrapperRef);
            }, duration);
        }

        return () => {
            clearTimeout(dismissRef.current);
        };
    }, []);

    return (
        <div
            style={{ ['--elm-translate' as any]: animationVariables[position as ToastPositionType] }}
            className={
                wrapperClasses[type] +
                'animate-toastIn' +
                ' w-max max-w-min p-2 text-base flex justify-between items-center overflow-hidden rounded-md shadow-lg my-3 relative'
            }
            ref={wrapperRef}
            role={'alert'}
        >
            {/* {icon && (
                <div className={clsx(iconClasses[type], 'flex p-3')}>
                    <div className="inline-flex justify-center items-center w-6 h-6">
                        <span className="sr-only">{type} Icon</span>
                        {icon}
                    </div>
                </div>
            )} */}
            <div className="text-sm font-semibold flex-grow p-3">{message}</div>
            {/* <button
                aria-label="Close"
                onClick={() => {
                    remove(id, wrapperRef);
                }}
                className={closeButtonClasses}
            >
                <span className="sr-only">Close</span>
                {closeIcon}
            </button> */}
        </div>
    );

    /* return toast ? (
        <div
            style={{ ['--elm-translate' as any]: animationVariables[toast?.position] }}
            className={
                wrapperClasses[toast?.type] +
                ' w-max p-4 text-base flex justify-between items-center overflow-hidden rounded-md shadow-lg my-3 relative'
            }
            role="alert"
        >
            🎉
            <div>
                <span className="font-medium">Hurray!</span> {toast.message}
            </div>
        </div>
    ) : null; */
}
