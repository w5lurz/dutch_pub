import useToast from '../../hooks/useToast';
import { animationVariables, positionClasses, wrapperClasses } from './utils';

export default function Toast() {
    const { toast } = useToast();
    return toast ? (
        <div className={positionClasses[toast?.position] + ' fixed w-screen max-w-xs z-50'}>
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
        </div>
    ) : null;
}
