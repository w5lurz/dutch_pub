import { useEffect } from 'react';
import { setToast } from '../app/generalSlice';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { RootState } from '../app/store';
import { TToast } from '../app/types';

export default function useToast() {
    const dispatch = useAppDispatch();
    const toast: TToast | null = useAppSelector((state: RootState) => state.general.toast);

    useEffect(() => {
        if (toast?.duration) {
            setTimeout(() => {
                dispatch(setToast(null));
            }, toast?.duration);
        }
    });

    return { toast };
}
