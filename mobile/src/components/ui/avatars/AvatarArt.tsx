import type { ReactElement } from 'react';
import { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';
import type { AvatarId } from '@dutch-pub/shared';

import i18n from '@/i18n';

// Self-made animal faces for the preset avatars (see LICENSE.md next to this file), drawn
// in a 100 x 100 box; the Avatar component clips them to a circle. Fixed colours: like
// card faces, avatars look the same in light and dark mode.

const INK = '#2b2118';
const PINK = '#f4a7b9';
const WHITE = '#ffffff';

function Eyes({ y, dx = 11, r = 4, cx = 50 }: { y: number; dx?: number; r?: number; cx?: number }) {
    return (
        <G>
            {[cx - dx, cx + dx].map(x => (
                <G key={x}>
                    <Circle cx={x} cy={y} r={r} fill={INK} />
                    <Circle cx={x + r * 0.35} cy={y - r * 0.35} r={r * 0.35} fill={WHITE} />
                </G>
            ))}
        </G>
    );
}

function Smile({ y, w = 7, cx = 50 }: { y: number; w?: number; cx?: number }) {
    return <Path d={`M${cx - w} ${y} Q${cx} ${y + w * 0.9} ${cx + w} ${y}`} stroke={INK} strokeWidth={2.4} strokeLinecap="round" fill="none" />;
}

function Cheeks({ y, dx = 20, color = PINK }: { y: number; dx?: number; color?: string }) {
    return (
        <G opacity={0.6}>
            <Ellipse cx={50 - dx} cy={y} rx={5} ry={3.2} fill={color} />
            <Ellipse cx={50 + dx} cy={y} rx={5} ry={3.2} fill={color} />
        </G>
    );
}

function Whiskers({ y }: { y: number }) {
    const lines = [
        [30, -3, 14, -6],
        [30, 2, 14, 3],
    ];
    return (
        <G stroke={INK} strokeWidth={1.4} strokeLinecap="round" opacity={0.7}>
            {lines.map(([x1, y1, x2, y2], i) => (
                <G key={i}>
                    <Path d={`M${x1} ${y + y1} L${x2} ${y + y2}`} />
                    <Path d={`M${100 - x1} ${y + y1} L${100 - x2} ${y + y2}`} />
                </G>
            ))}
        </G>
    );
}

const Cat = () => (
    <G>
        <Polygon points="24,44 28,14 46,32" fill="#f2a65a" />
        <Polygon points="76,44 72,14 54,32" fill="#f2a65a" />
        <Polygon points="29,36 31,22 40,31" fill={PINK} />
        <Polygon points="71,36 69,22 60,31" fill={PINK} />
        <Circle cx={50} cy={56} r={30} fill="#f2a65a" />
        <Path d="M42 30 L44 40 M50 28 L50 39 M58 30 L56 40" stroke="#c97a35" strokeWidth={3} strokeLinecap="round" />
        <Eyes y={54} />
        <Polygon points="46,63 54,63 50,68" fill="#e0707f" />
        <Smile y={70} w={5} />
        <Whiskers y={66} />
    </G>
);

const Dog = () => (
    <G>
        <Circle cx={50} cy={54} r={29} fill="#d8a46c" />
        <Ellipse cx={22} cy={52} rx={9} ry={20} fill="#8a5a36" transform="rotate(15 22 52)" />
        <Ellipse cx={78} cy={52} rx={9} ry={20} fill="#8a5a36" transform="rotate(-15 78 52)" />
        <Ellipse cx={62} cy={46} rx={9} ry={8} fill="#b9814c" />
        <Ellipse cx={50} cy={67} rx={15} ry={11} fill="#f3dcc0" />
        <Eyes y={50} />
        <Ellipse cx={50} cy={62} rx={5.5} ry={4} fill={INK} />
        <Smile y={69} w={5} />
        <Ellipse cx={50} cy={75} rx={3.5} ry={4} fill="#e0707f" />
    </G>
);

const Fox = () => (
    <G>
        <Polygon points="20,46 24,12 44,32" fill="#e9732f" />
        <Polygon points="80,46 76,12 56,32" fill="#e9732f" />
        <Polygon points="26,36 27,22 37,31" fill={INK} />
        <Polygon points="74,36 73,22 63,31" fill={INK} />
        <Path d="M18 44 Q50 18 82 44 Q80 70 50 84 Q20 70 18 44 Z" fill="#e9732f" />
        <Path d="M22 52 Q36 54 50 84 Q64 54 78 52 Q70 76 50 84 Q30 76 22 52 Z" fill={WHITE} />
        <Eyes y={52} dx={13} />
        <Ellipse cx={50} cy={74} rx={4.5} ry={3.5} fill={INK} />
    </G>
);

const Bear = () => (
    <G>
        <Circle cx={26} cy={30} r={11} fill="#8b5e3c" />
        <Circle cx={74} cy={30} r={11} fill="#8b5e3c" />
        <Circle cx={26} cy={30} r={5.5} fill="#c89a72" />
        <Circle cx={74} cy={30} r={5.5} fill="#c89a72" />
        <Circle cx={50} cy={56} r={30} fill="#8b5e3c" />
        <Ellipse cx={50} cy={67} rx={13} ry={10} fill="#d8b48e" />
        <Eyes y={51} dx={12} />
        <Ellipse cx={50} cy={62} rx={5} ry={3.6} fill={INK} />
        <Smile y={69} w={4.5} />
    </G>
);

const Panda = () => (
    <G>
        <Circle cx={25} cy={30} r={11} fill={INK} />
        <Circle cx={75} cy={30} r={11} fill={INK} />
        <Circle cx={50} cy={56} r={30} fill={WHITE} />
        <Ellipse cx={38} cy={53} rx={8} ry={10} fill={INK} transform="rotate(-25 38 53)" />
        <Ellipse cx={62} cy={53} rx={8} ry={10} fill={INK} transform="rotate(25 62 53)" />
        <Circle cx={39} cy={52} r={3} fill={WHITE} />
        <Circle cx={61} cy={52} r={3} fill={WHITE} />
        <Ellipse cx={50} cy={65} rx={4.5} ry={3.2} fill={INK} />
        <Smile y={71} w={4.5} />
        <Cheeks y={66} dx={19} />
    </G>
);

const Rabbit = () => (
    <G>
        <Ellipse cx={37} cy={22} rx={8} ry={20} fill="#e8e4ef" transform="rotate(-10 37 22)" />
        <Ellipse cx={63} cy={22} rx={8} ry={20} fill="#e8e4ef" transform="rotate(10 63 22)" />
        <Ellipse cx={37} cy={23} rx={4} ry={14} fill={PINK} transform="rotate(-10 37 23)" />
        <Ellipse cx={63} cy={23} rx={4} ry={14} fill={PINK} transform="rotate(10 63 23)" />
        <Circle cx={50} cy={60} r={27} fill="#e8e4ef" />
        <Eyes y={57} dx={11} />
        <Ellipse cx={50} cy={66} rx={3.5} ry={2.6} fill="#e0707f" />
        <Rect x={46.5} y={72} width={7} height={6} rx={1.5} fill={WHITE} stroke={INK} strokeWidth={1} />
        <Path d="M44 70 Q50 74 56 70" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
        <Cheeks y={69} dx={17} />
    </G>
);

const Mouse = () => (
    <G>
        <Circle cx={24} cy={34} r={16} fill="#a7a9b4" />
        <Circle cx={76} cy={34} r={16} fill="#a7a9b4" />
        <Circle cx={24} cy={34} r={10} fill={PINK} />
        <Circle cx={76} cy={34} r={10} fill={PINK} />
        <Ellipse cx={50} cy={60} rx={25} ry={24} fill="#a7a9b4" />
        <Eyes y={56} dx={10} r={3.6} />
        <Circle cx={50} cy={67} r={3.5} fill="#e0707f" />
        <Smile y={72} w={4} />
        <Whiskers y={68} />
    </G>
);

const Pig = () => (
    <G>
        <Polygon points="22,40 26,18 42,30" fill="#f2a0b0" />
        <Polygon points="78,40 74,18 58,30" fill="#f2a0b0" />
        <Circle cx={50} cy={56} r={30} fill="#f7b8c4" />
        <Eyes y={48} dx={12} />
        <Ellipse cx={50} cy={64} rx={12} ry={8.5} fill="#ee8fa3" />
        <Ellipse cx={45.5} cy={64} rx={2.3} ry={3.4} fill="#b44d63" />
        <Ellipse cx={54.5} cy={64} rx={2.3} ry={3.4} fill="#b44d63" />
        <Smile y={76} w={5} />
    </G>
);

const Frog = () => (
    <G>
        <Circle cx={32} cy={34} r={12} fill="#6cbf4f" />
        <Circle cx={68} cy={34} r={12} fill="#6cbf4f" />
        <Ellipse cx={50} cy={60} rx={34} ry={24} fill="#6cbf4f" />
        <Circle cx={32} cy={33} r={7.5} fill={WHITE} />
        <Circle cx={68} cy={33} r={7.5} fill={WHITE} />
        <Eyes y={34} dx={18} r={4.2} />
        <Path d="M30 62 Q50 78 70 62" stroke={INK} strokeWidth={2.6} fill="none" strokeLinecap="round" />
        <Cheeks y={64} dx={26} />
        <Circle cx={46} cy={52} r={1.3} fill={INK} />
        <Circle cx={54} cy={52} r={1.3} fill={INK} />
    </G>
);

const Owl = () => (
    <G>
        <Polygon points="22,32 30,14 40,30" fill="#8a6a4a" />
        <Polygon points="78,32 70,14 60,30" fill="#8a6a4a" />
        <Ellipse cx={50} cy={58} rx={31} ry={30} fill="#8a6a4a" />
        <Ellipse cx={50} cy={70} rx={18} ry={16} fill="#d9c3a2" />
        <Circle cx={37} cy={48} r={11} fill={WHITE} />
        <Circle cx={63} cy={48} r={11} fill={WHITE} />
        <Eyes y={48} dx={13} r={5} />
        <Polygon points="45,57 55,57 50,66" fill="#f0a93b" />
        <Path d="M42 74 L46 77 L50 74 L54 77 L58 74" stroke="#a88a64" strokeWidth={1.6} fill="none" />
    </G>
);

const Koala = () => (
    <G>
        <Circle cx={22} cy={40} r={16} fill="#9ea3ab" />
        <Circle cx={78} cy={40} r={16} fill="#9ea3ab" />
        <Circle cx={22} cy={40} r={9} fill="#e6e2e0" />
        <Circle cx={78} cy={40} r={9} fill="#e6e2e0" />
        <Ellipse cx={50} cy={58} rx={27} ry={27} fill="#b3b8c0" />
        <Eyes y={52} dx={12} r={3.6} />
        <Ellipse cx={50} cy={63} rx={7} ry={9} fill="#3d3a3f" />
        <Smile y={76} w={4} />
    </G>
);

const Lion = () => (
    <G>
        {Array.from({ length: 12 }, (_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            return <Circle key={i} cx={50 + Math.cos(angle) * 27} cy={55 + Math.sin(angle) * 27} r={12} fill="#c4722a" />;
        })}
        <Circle cx={50} cy={55} r={27} fill="#c4722a" />
        <Circle cx={30} cy={36} r={6} fill="#f2c45a" />
        <Circle cx={70} cy={36} r={6} fill="#f2c45a" />
        <Circle cx={50} cy={56} r={22} fill="#f2c45a" />
        <Eyes y={51} dx={9} r={3.6} />
        <Ellipse cx={50} cy={65} rx={9} ry={6.5} fill="#f8e2a8" />
        <Polygon points="46,61 54,61 50,65" fill="#8a4b2a" />
        <Smile y={68} w={4} />
    </G>
);

const Tiger = () => (
    <G>
        <Circle cx={27} cy={32} r={9} fill="#f08a2c" />
        <Circle cx={73} cy={32} r={9} fill="#f08a2c" />
        <Circle cx={27} cy={32} r={4.5} fill={WHITE} />
        <Circle cx={73} cy={32} r={4.5} fill={WHITE} />
        <Circle cx={50} cy={56} r={30} fill="#f08a2c" />
        <Path d="M50 27 L46 37 L54 37 Z M40 29 L42 38 M60 29 L58 38" fill={INK} stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
        <Path d="M20 52 L30 54 M21 60 L30 60 M80 52 L70 54 M79 60 L70 60" stroke={INK} strokeWidth={2.8} strokeLinecap="round" />
        <Ellipse cx={50} cy={68} rx={14} ry={10} fill={WHITE} />
        <Eyes y={51} dx={11} />
        <Polygon points="46,62 54,62 50,67" fill="#e0707f" />
        <Smile y={70} w={4.5} />
    </G>
);

const Monkey = () => (
    <G>
        <Circle cx={20} cy={54} r={11} fill="#8b5a3c" />
        <Circle cx={80} cy={54} r={11} fill="#8b5a3c" />
        <Circle cx={20} cy={54} r={6} fill="#e9c4a0" />
        <Circle cx={80} cy={54} r={6} fill="#e9c4a0" />
        <Circle cx={50} cy={54} r={29} fill="#8b5a3c" />
        <Circle cx={41} cy={50} r={10} fill="#e9c4a0" />
        <Circle cx={59} cy={50} r={10} fill="#e9c4a0" />
        <Ellipse cx={50} cy={66} rx={17} ry={12} fill="#e9c4a0" />
        <Eyes y={50} dx={9} r={3.6} />
        <Circle cx={47} cy={62} r={1.4} fill={INK} />
        <Circle cx={53} cy={62} r={1.4} fill={INK} />
        <Smile y={68} w={6} />
    </G>
);

const Penguin = () => (
    <G>
        <Ellipse cx={50} cy={58} rx={31} ry={31} fill="#2f3542" />
        <Circle cx={40} cy={56} r={13} fill={WHITE} />
        <Circle cx={60} cy={56} r={13} fill={WHITE} />
        <Ellipse cx={50} cy={70} rx={20} ry={15} fill={WHITE} />
        <Eyes y={54} dx={9} r={3.6} />
        <Polygon points="43,63 57,63 50,71" fill="#f3a531" />
        <Cheeks y={66} dx={18} />
    </G>
);

const Chick = () => (
    <G>
        <Path d="M50 30 Q44 18 50 14 M50 30 Q58 20 62 22" stroke="#e5b82e" strokeWidth={3} fill="none" strokeLinecap="round" />
        <Circle cx={50} cy={58} r={29} fill="#ffd84d" />
        <Eyes y={54} dx={10} />
        <Polygon points="43,62 57,62 50,70" fill="#f39a2b" />
        <Cheeks y={65} dx={18} color="#f78f8f" />
    </G>
);

const Cow = () => (
    <G>
        <Path d="M30 30 Q22 18 26 12 M70 30 Q78 18 74 12" stroke="#e8d7b0" strokeWidth={5} fill="none" strokeLinecap="round" />
        <Ellipse cx={18} cy={44} rx={11} ry={6} fill="#f4f1ec" transform="rotate(20 18 44)" />
        <Ellipse cx={82} cy={44} rx={11} ry={6} fill="#f4f1ec" transform="rotate(-20 82 44)" />
        <Ellipse cx={50} cy={52} rx={27} ry={28} fill="#f4f1ec" />
        <Path d="M30 34 Q38 28 44 36 Q42 46 32 44 Q26 40 30 34 Z" fill={INK} />
        <Ellipse cx={66} cy={40} rx={6} ry={5} fill={INK} />
        <Eyes y={48} dx={11} />
        <Ellipse cx={50} cy={68} rx={18} ry={11} fill="#f6b6c2" />
        <Ellipse cx={44} cy={67} rx={2.5} ry={3.5} fill="#b44d63" />
        <Ellipse cx={56} cy={67} rx={2.5} ry={3.5} fill="#b44d63" />
    </G>
);

const Raccoon = () => (
    <G>
        <Polygon points="22,40 26,16 44,30" fill="#7d7f88" />
        <Polygon points="78,40 74,16 56,30" fill="#7d7f88" />
        <Polygon points="27,34 29,23 37,30" fill="#e7e7ea" />
        <Polygon points="73,34 71,23 63,30" fill="#e7e7ea" />
        <Circle cx={50} cy={56} r={30} fill="#9a9ca5" />
        <Path d="M22 52 Q36 40 50 52 Q64 40 78 52 Q72 62 60 58 Q50 54 40 58 Q28 62 22 52 Z" fill="#3a3a42" />
        <Path d="M30 44 Q38 38 46 44 M54 44 Q62 38 70 44" stroke={WHITE} strokeWidth={3} fill="none" strokeLinecap="round" />
        <Ellipse cx={50} cy={70} rx={13} ry={9} fill="#e7e7ea" />
        <Circle cx={38} cy={52} r={4} fill={WHITE} />
        <Circle cx={62} cy={52} r={4} fill={WHITE} />
        <Eyes y={52} dx={12} r={2.6} />
        <Ellipse cx={50} cy={66} rx={4.5} ry={3.3} fill={INK} />
        <Smile y={72} w={4} />
    </G>
);

const Hedgehog = () => (
    <G>
        <Polygon
            points="50,14 58,24 70,16 72,30 86,28 80,40 92,48 80,54 88,66 74,66 74,80 62,74 50,86 38,74 26,80 26,66 12,66 20,54 8,48 20,40 14,28 28,30 30,16 42,24"
            fill="#6b4a33"
        />
        <Ellipse cx={50} cy={60} rx={24} ry={22} fill="#e9c9a1" />
        <Eyes y={56} dx={9} r={3.6} />
        <Circle cx={50} cy={66} r={4} fill={INK} />
        <Smile y={71} w={4} />
        <Cheeks y={66} dx={15} />
    </G>
);

const Sheep = () => (
    <G>
        {Array.from({ length: 10 }, (_, i) => {
            const angle = (i / 10) * Math.PI * 2;
            return <Circle key={i} cx={50 + Math.cos(angle) * 26} cy={54 + Math.sin(angle) * 26} r={12} fill={WHITE} />;
        })}
        <Circle cx={50} cy={54} r={26} fill={WHITE} />
        <Ellipse cx={24} cy={54} rx={9} ry={5} fill="#4a3c35" transform="rotate(25 24 54)" />
        <Ellipse cx={76} cy={54} rx={9} ry={5} fill="#4a3c35" transform="rotate(-25 76 54)" />
        <Ellipse cx={50} cy={60} rx={16} ry={20} fill="#4a3c35" />
        <Circle cx={44} cy={36} r={8} fill={WHITE} />
        <Circle cx={56} cy={36} r={8} fill={WHITE} />
        <Circle cx={43} cy={56} r={3.4} fill={WHITE} />
        <Circle cx={57} cy={56} r={3.4} fill={WHITE} />
        <Circle cx={43.5} cy={56.5} r={2} fill={INK} />
        <Circle cx={56.5} cy={56.5} r={2} fill={INK} />
        <Path d="M45 70 Q50 74 55 70" stroke="#f4c6d0" strokeWidth={2.2} fill="none" strokeLinecap="round" />
    </G>
);

/** Art per preset id; each draws in a 100 x 100 viewBox. */
export const AVATAR_ART: Record<AvatarId, () => ReactElement> = {
    cat: Cat,
    dog: Dog,
    fox: Fox,
    bear: Bear,
    panda: Panda,
    rabbit: Rabbit,
    mouse: Mouse,
    pig: Pig,
    frog: Frog,
    owl: Owl,
    koala: Koala,
    lion: Lion,
    tiger: Tiger,
    monkey: Monkey,
    penguin: Penguin,
    chick: Chick,
    cow: Cow,
    raccoon: Raccoon,
    hedgehog: Hedgehog,
    sheep: Sheep,
};

/** Names for screen readers and the picker, e.g. "Fox". */
export const avatarName = (id: AvatarId) => i18n.t(`avatar.names.${id}`);
