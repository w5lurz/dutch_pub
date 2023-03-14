import { RequiredToastProps, ToastPositionType } from '../../app/types';

export const wrapperClasses: Record<RequiredToastProps['type'], string> = {
    info: 'text-blue-800 border border-blue-300 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400 dark:border-blue-800',
    success: 'text-green-800 border border-green-300 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400 dark:border-green-800',
    warning:
        'text-yellow-800 border border-yellow-300 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300 dark:border-yellow-800',
    error: 'text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800',
};

export const animationVariables: Record<ToastPositionType, string> = {
    topRight: 'translateX(2000px)',
    topCenter: 'translateY(-1300px)',
    topLeft: 'translateX(-2000px)',
    bottomLeft: 'translateX(-2000px)',
    bottomCenter: 'translateY(1300px)',
    bottomRight: 'translateX(2000px)',
};

export const positionClasses: Record<ToastPositionType, string> = {
    topRight: 'top-0 right-1',
    topCenter: 'top-0 right-1/2 translate-x-1/2',
    topLeft: 'top-0 left-1',
    bottomLeft: 'bottom-0 left-1',
    bottomCenter: 'bottom-0 right-1/2 translate-x-1/2',
    bottomRight: 'bottom-0 right-1',
};
