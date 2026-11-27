import { fireEvent, render, screen } from '@testing-library/react-native';
import { AVATAR_IDS, generatedAvatarId } from '@dutch-pub/shared';

import { Avatar, describeAvatar } from '../Avatar';
import { AvatarPicker } from '../AvatarPicker';
import { AVATAR_ART } from '../avatars/AvatarArt';

describe('Avatar', () => {
    it('has art for every preset', () => {
        expect(Object.keys(AVATAR_ART).sort()).toEqual([...AVATAR_IDS].sort());
    });

    it('shows the chosen avatar', async () => {
        await render(<Avatar username="anna" avatar="fox" size={40} accessibilityLabel="anna's avatar" />);
        expect(screen.getByTestId('avatar-fox')).toBeTruthy();
        expect(screen.getByLabelText("anna's avatar")).toBeTruthy();
    });

    it('falls back to the one generated from the name (also for unknown ids)', async () => {
        await render(
            <>
                <Avatar username="Julcsi" size={40} />
                <Avatar username="Julcsi" avatar="unicorn" size={40} />
            </>,
        );
        expect(screen.getAllByTestId(`avatar-${generatedAvatarId('Julcsi')}`)).toHaveLength(2);
    });

    it('renders every preset', async () => {
        await render(
            <>
                {AVATAR_IDS.map(id => (
                    <Avatar key={id} username="x" avatar={id} size={24} />
                ))}
            </>,
        );
        AVATAR_IDS.forEach(id => expect(screen.getByTestId(`avatar-${id}`)).toBeTruthy());
    });

    it('describes it for screen readers', () => {
        expect(describeAvatar('anna', 'owl')).toBe('Owl avatar');
        expect(describeAvatar('anna')).toMatch(/\(generated from the name\)$/);
    });
});

describe('AvatarPicker', () => {
    it('offers every preset and marks the chosen one', async () => {
        const onChange = jest.fn();
        await render(<AvatarPicker username="anna" value="cow" onChange={onChange} />);
        expect(screen.getAllByRole('radio')).toHaveLength(AVATAR_IDS.length);
        expect(screen.getByRole('radio', { name: 'Cow' })).toBeSelected();
        fireEvent.press(screen.getByRole('radio', { name: 'Tiger' }));
        expect(onChange).toHaveBeenCalledWith('tiger');
    });

    it('goes back to the generated one', async () => {
        const onChange = jest.fn();
        await render(<AvatarPicker username="anna" value="cow" onChange={onChange} />);
        fireEvent.press(screen.getByRole('button', { name: 'Use my generated one' }));
        expect(onChange).toHaveBeenCalledWith(null);
    });

    it('marks the generated one while nothing is chosen', async () => {
        const onChange = jest.fn();
        await render(<AvatarPicker username="anna" value={null} onChange={onChange} />);
        const generated = generatedAvatarId('anna');
        const name = generated.charAt(0).toUpperCase() + generated.slice(1);
        expect(screen.getByRole('radio', { name: `${name}, your generated avatar` })).toBeSelected();
        expect(screen.getByRole('button', { name: 'Use my generated one' })).toBeDisabled();
    });

    it('blocks choices while saving', async () => {
        const onChange = jest.fn();
        await render(<AvatarPicker username="anna" value="cow" onChange={onChange} disabled />);
        fireEvent.press(screen.getByRole('radio', { name: 'Tiger' }));
        expect(onChange).not.toHaveBeenCalled();
    });
});
