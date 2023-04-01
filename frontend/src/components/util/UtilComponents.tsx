import { User } from '../../app/types';
import Card from '../Game/components/Card';

export const SpadeIcon = () => (
    <svg
        fill="#000000"
        version="1.1"
        id="Capa_1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 40.679 40.679"
        xmlSpace="preserve"
        className="w-6 h-6"
    >
        <g>
            <path
                d="M34.592,20.101c1.006,1.808,2.146,3.854,1.892,7.08c-0.298,3.947-2.771,6.509-6.785,7.023
		c-1.688,0.223-3.075,0.096-4.066-0.394c-0.666-0.326-1.243-0.768-1.76-1.26c0.55,2.049,1.516,3.729,2.46,5.371
		c0.224,0.391,0.445,0.775,0.66,1.163c0.167,0.303,0.167,0.67-0.002,0.972c-0.169,0.303-0.48,0.496-0.826,0.512
		c-1.631,0.076-3.376,0.11-5.496,0.11c-1.595,0-3.21-0.021-4.851-0.04l-1.082-0.013c-0.32-0.005-0.618-0.16-0.804-0.421
		c-0.185-0.262-0.234-0.594-0.133-0.897c0.175-0.521,0.456-0.964,0.703-1.354c0.081-0.128,0.162-0.255,0.238-0.384l0.14-0.254
		c0.23-0.41,0.46-0.822,0.671-1.271l0.216-0.474c0.428-0.928,0.87-1.888,1.12-2.897c0.01-0.042,0.02-0.083,0.03-0.125
		c-0.935,0.938-2.134,1.735-3.778,1.819c-2.358,0.1-4.16-0.604-4.813-0.896c-2.51-1.153-3.902-3.391-4.145-6.653
		c-0.098-1.347,0.145-2.904,0.666-4.278c0.705-1.886,1.973-3.858,3.092-5.602c0.569-0.869,1.188-1.697,1.785-2.498
		c0.309-0.408,2.857-3.774,3.25-4.259c1.899-2.346,3.56-5.104,5.166-7.774c0.389-0.646,0.776-1.291,1.168-1.93
		C19.488,0.182,19.811,0,20.158,0c0,0,0,0,0.001,0c0.348,0,0.67,0.181,0.852,0.477c0.838,1.364,1.722,2.698,2.656,4.11l1.039,1.574
		c1.256,1.929,2.707,3.8,4.108,5.608c1.983,2.56,4.034,5.204,5.689,8.177L34.592,20.101z"
            />
        </g>
    </svg>
);

export const DiamondsIcon = () => (
    <svg className="w-6 h-6" fill="red" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.050 5.438l8.537 10.501-8.537 10.501-8.537-10.501 8.537-10.501z"></path>
    </svg>
);

export const ClubsIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <path
            fill="#000000"
            d="M477.443 295.143a104.45 104.45 0 0 1-202.26 36.67c-.08 68.73 4.33 114.46 69.55 149h-177.57c65.22-34.53 69.63-80.25 69.55-149a104.41 104.41 0 1 1-66.34-136.28 104.45 104.45 0 1 1 171.14 0 104.5 104.5 0 0 1 135.93 99.61z"
        />
    </svg>
);

export const HeartsIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <path
            fill="red"
            d="M480.25 156.355c0 161.24-224.25 324.43-224.25 324.43S31.75 317.595 31.75 156.355c0-91.41 70.63-125.13 107.77-125.13 77.65 0 116.48 65.72 116.48 65.72s38.83-65.73 116.48-65.73c37.14.01 107.77 33.72 107.77 125.14z"
        />
    </svg>
);

export const CardBackSide = () => (
    <svg
        className="w-20 h-28 -m-2"
        xmlns="http://www.w3.org/2000/svg"
        height="94mm"
        preserveAspectRatio="none"
        viewBox="-132 -180 264 360"
        width="69mm"
    >
        <defs>
            <pattern id="B1" width="6" height="6" patternUnits="userSpaceOnUse">
                <path d="M3 0L6 3L3 6L0 3Z" fill="black"></path>
            </pattern>
        </defs>
        <rect x="-240" y="-336" width="480" height="672" fill="white"></rect>
        <rect width="239" height="335" x="-119.5" y="-167.5" rx="12" ry="12" fill="white" stroke="black"></rect>
        <rect fill="url(#B1)" width="204" height="300" x="-102" y="-150" rx="12" ry="12"></rect>
    </svg>
);

export const CardIcon = (iconName: string) => {
    switch (iconName) {
        case 'spade':
            return <SpadeIcon />;
        case 'diamonds':
            return <DiamondsIcon />;
        case 'clubs':
            return <ClubsIcon />;
        case 'hearts':
            return <HeartsIcon />;
        default:
            return <SpadeIcon />;
    }
};

export const DutchPubLogo = () => (
    <svg id="a" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 564.41 459.03" className="h-10 w-10 stroke-blue-300">
        <line style={{ strokeWidth: '16', fill: 'none', strokeMiterlimit: 10 }} x1="4.5" x2="4.5" y2="459.03" />
        <line style={{ strokeWidth: '16', fill: 'none', strokeMiterlimit: 10 }} x1="559.91" x2="559.91" y2="459.03" />
        <line style={{ strokeWidth: '16', fill: 'none', strokeMiterlimit: 10 }} x1="4.5" y1="216.66" x2="559.91" y2="216.66" />
        <polyline
            className="stroke-[12px]"
            style={{ fill: 'none', strokeMiterlimit: 10 }}
            points="306.76 176.35 227.04 176.35 227.04 96.93 306.76 96.93 306.76 193.85"
        />
        <line className="stroke-[12px]" style={{ fill: 'none', strokeMiterlimit: 10 }} x1="152.47" y1="31.85" x2="152.47" y2="182.28" />
        <line className="stroke-[12px]" style={{ fill: 'none', strokeMiterlimit: 10 }} x1="194.9" y1="31.85" x2="194.9" y2="182.28" />
        <rect className="stroke-[12px]" style={{ fill: 'none', strokeMiterlimit: 10 }} x="45.52" y="95.61" width="79.71" height="79.42" />
        <polyline
            className="stroke-[12px]"
            style={{ fill: 'none', strokeMiterlimit: 10 }}
            points="342.76 96.93 342.76 107.07 342.76 182.28"
        />
        <polyline
            className="stroke-[12px]"
            style={{ fill: 'none', strokeMiterlimit: 10 }}
            points="342.76 107.07 421.18 107.07 421.18 182.28"
        />
        <polyline
            className="stroke-[12px]"
            style={{ fill: 'none', strokeMiterlimit: 10 }}
            points="518.89 107.07 446.9 107.07 446.9 182.28 518.89 182.28 518.89 31.85"
        />
        <line className="stroke-[12px]" style={{ fill: 'none', strokeMiterlimit: 10 }} x1="28.29" y1="245.58" x2="28.29" y2="425.57" />
        <polyline
            className="stroke-[12px]"
            style={{ fill: 'none', strokeMiterlimit: 10 }}
            points="34.72 335.58 73.29 335.58 162.65 246.22"
        />
        <line className="stroke-[12px]" style={{ fill: 'none', strokeMiterlimit: 10 }} x1="162.65" y1="425.57" x2="72.97" y2="335.9" />
        <polyline
            className="stroke-[12px]"
            style={{ fill: 'none', strokeMiterlimit: 10 }}
            points="226.29 377.71 146.58 377.71 146.58 298.29 226.29 298.29 226.29 395.21"
        />
        <line className="stroke-[12px]" style={{ fill: 'none', strokeMiterlimit: 10 }} x1="226.29" y1="234.01" x2="194.15" y2="275.3" />
        <polyline
            className="stroke-[12px]"
            style={{ fill: 'none', strokeMiterlimit: 10 }}
            points="253.34 290.9 253.34 313.53 253.34 395.21"
        />
        <line className="stroke-[12px]" style={{ fill: 'none', strokeMiterlimit: 10 }} x1="253.34" y1="313.53" x2="317.22" y2="313.53" />
        <line className="stroke-[12px]" style={{ fill: 'none', strokeMiterlimit: 10 }} x1="336.1" y1="245.55" x2="336.1" y2="424.91" />
        <line className="stroke-[12px]" style={{ fill: 'none', strokeMiterlimit: 10 }} x1="352.52" y1="268.47" x2="320.58" y2="268.47" />
        <polyline
            className="stroke-[12px]"
            style={{ fill: 'none', strokeMiterlimit: 10 }}
            points="362.28 290.9 362.28 356.2 430.22 356.2 430.22 290.9 430.22 418.18 362.28 418.18 362.28 391.71"
        />
        <polyline
            className="stroke-[12px]"
            style={{ fill: 'none', strokeMiterlimit: 10 }}
            points="536.12 377.71 456.41 377.71 456.41 298.29 536.12 298.29 536.12 395.21"
        />
    </svg>
);

export const renderFlippedCards = (count: number, user: User, roomId: number, active: boolean = false, canTouch: boolean = false) => {
    let arr = [];
    for (let i = 0; i < count; i++) {
        arr.push(<Card key={`flipped-${i}`} card={i} active={active} i={i} user={user} roomId={roomId} canTouch={canTouch} />);
    }
    return arr;
};
