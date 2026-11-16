export const calculateColorClasses = (colorName: string, disabled?: boolean) => {
    if (disabled) {
        return ' bg-gray-300 border-gray-500 cursor-not-allowed';
    }
    switch (colorName) {
        case 'green':
            return ' bg-green-300 border-green-500 hover:bg-green-500 hover:border-green-300';
        case 'blue':
            return ' bg-blue-300 border-blue-500 hover:bg-blue-500 hover:border-blue-300';
        case 'yellow':
            return ' bg-yellow-300 border-yellow-500 hover:bg-yellow-500 hover:border-yellow-300';
        case 'red':
            return ' bg-red-300 border-red-500 hover:bg-red-500 hover:border-red-300';
        default:
            return ' bg-blue-300 border-blue-500 hover:bg-blue-500 hover:border-blue-300';
    }
};


export const isPrivate = (visibility: string) => visibility === 'private';
