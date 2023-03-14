import { useEffect } from 'react';
import { setToast } from '../../app/generalSlice';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { RootState } from '../../app/store';
import { TToast } from '../../app/types';
import { animationVariables, positionClasses, wrapperClasses } from './utils';

export default function Toast() {
    const dispatch = useAppDispatch();
    const toast: TToast | null = useAppSelector((state: RootState) => state.general.toast);
    useEffect(() => {
        if (toast?.duration) {
            setTimeout(() => {
                dispatch(setToast(null));
            }, toast?.duration);
        }
    });
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
