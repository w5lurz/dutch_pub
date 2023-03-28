import useToast from '../../hooks/useToast';
import { animationVariables, positionClasses, wrapperClasses } from './utils';

const renderToastMessageStart = (type: 'success' | 'info' | 'warning' | 'error' | 'sad') => {
    if (type === 'success') {
        return <span className="font-medium">🎉Hurray!</span>;
    }
    if (type === 'info') {
        return <span className="font-medium">ℹ️You must know about this.</span>;
    }
    if (type === 'warning') {
        return <span className="font-medium">⚠️Hello there!</span>;
    }
    if (type === 'error') {
        return <span className="font-medium">❌Oh no!</span>;
    }
    if (type === 'sad') {
        return <span className="font-medium">😔We&apos;re sorry!</span>;
    }
    return 'Maybe wrong Toast type specified!';
};

export default function Toast() {
    const { toast, wrapperRef, dismissRef } = useToast();
    if (toast) {
        const { type, position = 'topCenter', message } = toast;
        return (
            <div className={positionClasses[position] + ' fixed w-screen max-w-xs z-[100]'}>
                <div
                    style={{ ['--elm-translate' as any]: animationVariables[position] }}
                    className={
                        wrapperClasses[type] +
                        'animate-toastIn' +
                        ' w-max p-4 text-base flex justify-between items-center overflow-hidden rounded-md shadow-lg my-3 relative'
                    }
                    ref={wrapperRef}
                    role="alert"
                >
                    <div>
                        {renderToastMessageStart(type)} {message}
                    </div>
                </div>
            </div>
        );
    } else return null;
}
