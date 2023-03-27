import { RefObject, useEffect, useRef } from 'react';
import { setToast } from '../app/generalSlice';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { RootState } from '../app/store';
import { TToast } from '../app/types';

export default function useToast() {
    const dispatch = useAppDispatch();
    const toast: TToast | null = useAppSelector((state: RootState) => state.general.toast);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const dismissRef = useRef<ReturnType<typeof setTimeout>>();

    const remove = (ref: RefObject<HTMLDivElement>) => {
        ref?.current?.classList.add('animate-toastOut');

        //remove element after animation is done
        ref?.current?.addEventListener('animationend', () => {
            // lets remove it
            dispatch(setToast(null));
        });
    };

    useEffect(() => {
        if (toast?.duration) {
            dismissRef.current = setTimeout(() => {
                remove(wrapperRef);
            }, toast?.duration);
        }

        return () => {
            clearTimeout(dismissRef.current);
        };
    }, [toast]);

    return { toast, wrapperRef, dismissRef };
}
