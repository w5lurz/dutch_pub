export const calculateColorClasses = (colorName: string) => {
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

export const calculateBorderClasses = (i: number, length: number) => {
    // if (i === 0) {
    //     return ' border-l-2';
    // }
    console.log(i, length);
    let multiplier = 32;
    let position = 0;
    if (i !== 0) {
        position = i * multiplier;
        const sas = ' left-' + position;
        console.log(position, multiplier, 'SAS', sas);
        return sas;
    }
    return ' left-0';
};

export const getFirstArrayItem = <T extends Array<any>>(arr: T) => arr[0];
export const getSecondArrayItem = <T extends Array<any>>(arr: T) => arr && arr.length >= 2 && arr[1];
