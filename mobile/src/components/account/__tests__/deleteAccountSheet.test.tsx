import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { DeleteAccountSheet } from '../DeleteAccountSheet';

jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);

describe('DeleteAccountSheet', () => {
    it('needs the password; shows why the server refused; closes once deleted', async () => {
        const onClose = jest.fn();
        const onDelete = jest.fn(async (password: string) => (password === 'right' ? null : 'Wrong password.'));
        await render(<DeleteAccountSheet visible onClose={onClose} onDelete={onDelete} />);

        await fireEvent.press(screen.getByText('Delete my account'));
        expect(onDelete).not.toHaveBeenCalled();

        await fireEvent.changeText(screen.getByLabelText('Password'), 'wrong');
        await fireEvent.press(screen.getByText('Delete my account'));
        expect(await screen.findByText('Wrong password.')).toBeTruthy();
        expect(onClose).not.toHaveBeenCalled();

        await fireEvent.changeText(screen.getByLabelText('Password'), 'right');
        await fireEvent.press(screen.getByText('Delete my account'));
        await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
        expect(onDelete).toHaveBeenLastCalledWith('right');
    });
});
