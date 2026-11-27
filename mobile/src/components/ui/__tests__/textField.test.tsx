import { fireEvent, render, screen } from '@testing-library/react-native';

import { TextField } from '../TextField';

describe('TextField password toggle', () => {
    it('hides the password until the eye button is pressed, and hides it again', async () => {
        await render(<TextField label="Password" value="secret" secureTextEntry />);
        expect(screen.getByLabelText('Password')).toHaveProp('secureTextEntry', true);

        await fireEvent.press(screen.getByRole('button', { name: 'Show password' }));
        expect(screen.getByLabelText('Password')).toHaveProp('secureTextEntry', false);

        await fireEvent.press(screen.getByRole('button', { name: 'Hide password' }));
        expect(screen.getByLabelText('Password')).toHaveProp('secureTextEntry', true);
    });

    it('has no toggle on other fields, or when turned off', async () => {
        await render(
            <>
                <TextField label="Username" value="julcsi" />
                <TextField label="PIN" value="1234" secureTextEntry revealable={false} />
            </>,
        );
        expect(screen.queryByRole('button', { name: 'Show password' })).toBeNull();
        expect(screen.getByLabelText('PIN')).toHaveProp('secureTextEntry', true);
    });

    it('cannot be toggled while the field is not editable', async () => {
        await render(<TextField label="Password" value="secret" secureTextEntry editable={false} />);
        expect(screen.getByRole('button', { name: 'Show password' })).toBeDisabled();
    });
});
