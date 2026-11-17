import type { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import type { TRoom, TRooms } from '@dutch-pub/shared';

import { ChoiceRow, SettingRow } from '@/components/ui';
import { CreateRoomModal } from '../CreateRoomModal';
import { RoomCard } from '../RoomCard';
import { RoomSettingsSheet } from '../RoomSettingsSheet';
import { useRoomSettings } from '@/hooks/useRoomSettings';
import type { RoomPermissions } from '@/hooks/useRooms';
import roomsReducer, { setRooms } from '@/store/roomsSlice';
import userReducer, { setUser } from '@/store/userSlice';

jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);

const powersSwitch = () => screen.getByRole('switch', { name: 'Show card powers' });
const backOption = (name: 'Red' | 'Blue') => screen.getByRole('radio', { name });

describe('SettingRow', () => {
    it('toggles when the row is pressed', async () => {
        const onValueChange = jest.fn();
        await render(<SettingRow label="Sound" description="Plays sounds" value={false} onValueChange={onValueChange} />);
        expect(screen.getByText('Plays sounds')).toBeTruthy();
        await fireEvent.press(screen.getByRole('switch', { name: 'Sound' }));
        expect(onValueChange).toHaveBeenCalledWith(true);
    });

    it('is read-only when disabled', async () => {
        const onValueChange = jest.fn();
        await render(<SettingRow label="Sound" value onValueChange={onValueChange} disabled />);
        const row = screen.getByRole('switch', { name: 'Sound' });
        expect(row).toBeDisabled();
        expect(row).toBeChecked();
        await fireEvent.press(row);
        expect(onValueChange).not.toHaveBeenCalled();
    });
});

describe('ChoiceRow', () => {
    const options = [
        { value: 'red', label: 'Red', swatch: '#f00' },
        { value: 'blue', label: 'Blue' },
    ] as const;

    it('is a radio group that changes on press', async () => {
        const onChange = jest.fn();
        await render(<ChoiceRow label="Colour" description="Pick one" options={options} value="red" onChange={onChange} />);
        expect(screen.getByText('Pick one')).toBeTruthy();
        expect(screen.getByLabelText('Colour').props.accessibilityRole).toBe('radiogroup');
        expect(backOption('Red')).toBeSelected();
        expect(backOption('Blue')).not.toBeSelected();
        expect(screen.getByTestId('swatch-red')).toBeTruthy();
        expect(screen.queryByTestId('swatch-blue')).toBeNull();
        await fireEvent.press(backOption('Blue'));
        expect(onChange).toHaveBeenCalledWith('blue');
    });

    it('is read-only when disabled', async () => {
        const onChange = jest.fn();
        await render(<ChoiceRow label="Colour" options={options} value="red" onChange={onChange} disabled />);
        expect(backOption('Blue')).toBeDisabled();
        await fireEvent.press(backOption('Blue'));
        expect(onChange).not.toHaveBeenCalled();
    });
});

describe('RoomSettingsSheet', () => {
    const props = { visible: true, onClose: jest.fn(), roomName: 'Pub', settings: { showCardPowers: true, cardBack: 'red' as const } };

    it('lets the owner change a setting and shows it right away', async () => {
        const onChange = jest.fn();
        await render(<RoomSettingsSheet {...props} canEdit onChange={onChange} />);
        expect(powersSwitch()).toBeChecked();
        expect(screen.getByText('Special cards show what they do (e.g. CLEAR ALL)')).toBeTruthy();
        await fireEvent.press(powersSwitch());
        expect(onChange).toHaveBeenCalledWith({ showCardPowers: false });
        expect(powersSwitch()).not.toBeChecked();
    });

    it('lets the owner pick the card back colour', async () => {
        const onChange = jest.fn();
        await render(<RoomSettingsSheet {...props} canEdit onChange={onChange} />);
        expect(screen.getByText('Colour of the backs of the cards')).toBeTruthy();
        expect(backOption('Red')).toBeSelected();
        await fireEvent.press(backOption('Blue'));
        expect(onChange).toHaveBeenCalledWith({ cardBack: 'blue' });
        expect(backOption('Blue')).toBeSelected();
        expect(backOption('Red')).not.toBeSelected();
    });

    it('follows the settings broadcast by the server', async () => {
        const view = await render(<RoomSettingsSheet {...props} canEdit onChange={jest.fn()} />);
        await view.rerender(<RoomSettingsSheet {...props} settings={{ showCardPowers: false, cardBack: 'blue' }} canEdit onChange={jest.fn()} />);
        expect(powersSwitch()).not.toBeChecked();
        expect(backOption('Blue')).toBeSelected();
    });

    it('is read-only for the other players', async () => {
        const onChange = jest.fn();
        await render(<RoomSettingsSheet {...props} canEdit={false} onChange={onChange} />);
        expect(screen.getByText('Only the owner of Pub can change these.')).toBeTruthy();
        expect(powersSwitch()).toBeDisabled();
        await fireEvent.press(powersSwitch());
        expect(backOption('Blue')).toBeDisabled();
        await fireEvent.press(backOption('Blue'));
        expect(onChange).not.toHaveBeenCalled();
        expect(backOption('Red')).toBeSelected();
    });

    it('closes with Done', async () => {
        const onClose = jest.fn();
        await render(<RoomSettingsSheet {...props} onClose={onClose} canEdit onChange={jest.fn()} />);
        await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
        expect(onClose).toHaveBeenCalled();
    });
});

describe('CreateRoomModal', () => {
    it('creates a room with the default settings', async () => {
        const onCreate = jest.fn();
        await render(<CreateRoomModal visible onClose={jest.fn()} onCreate={onCreate} />);
        expect(screen.getByText('Room settings')).toBeTruthy();
        expect(powersSwitch()).toBeChecked();
        await fireEvent.changeText(screen.getByLabelText('Room Name'), 'Pub');
        await fireEvent.press(screen.getByRole('button', { name: 'Create Room' }));
        expect(onCreate).toHaveBeenCalledWith({ name: 'Pub', slots: 2, visibility: 'private', settings: { showCardPowers: true, cardBack: 'red' } });
    });

    it('sends the chosen settings', async () => {
        const onCreate = jest.fn();
        await render(<CreateRoomModal visible onClose={jest.fn()} onCreate={onCreate} />);
        await fireEvent.press(powersSwitch());
        await fireEvent.changeText(screen.getByLabelText('Room Name'), 'Pub');
        await fireEvent.press(screen.getByRole('button', { name: 'Create Room' }));
        expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ settings: { showCardPowers: false, cardBack: 'red' } }));
    });

    it('sends the chosen card back colour', async () => {
        const onCreate = jest.fn();
        await render(<CreateRoomModal visible onClose={jest.fn()} onCreate={onCreate} />);
        expect(backOption('Red')).toBeSelected();
        await fireEvent.press(backOption('Blue'));
        await fireEvent.changeText(screen.getByLabelText('Room Name'), 'Pub');
        await fireEvent.press(screen.getByRole('button', { name: 'Create Room' }));
        expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ settings: { showCardPowers: true, cardBack: 'blue' } }));
    });
});

const room = (extra: Partial<TRoom> = {}): TRoom => ({
    name: 'Pub',
    owner: 'me',
    players: [{ username: 'me', socketId: 's1' }],
    slots: 2,
    visibility: 'public',
    settings: { showCardPowers: false, cardBack: 'blue' },
    ...extra,
});

describe('RoomCard', () => {
    const permissions: RoomPermissions = {
        canJoin: false,
        canLeave: false,
        canDelete: true,
        canStart: false,
        canViewSettings: true,
        canEditSettings: true,
    };
    const handlers = { onJoin: jest.fn(), onLeave: jest.fn(), onDelete: jest.fn(), onStart: jest.fn() };

    it('shows the settings and opens them for the owner', async () => {
        const onSettings = jest.fn();
        await render(<RoomCard room={room()} isCurrent permissions={permissions} {...handlers} onSettings={onSettings} />);
        expect(screen.getByText('Settings: Card powers hidden · Blue backs')).toBeTruthy();
        await fireEvent.press(screen.getByRole('button', { name: 'Change settings of room Pub' }));
        expect(onSettings).toHaveBeenCalled();
    });

    it('offers a read-only view to the other players and defaults for rooms without settings', async () => {
        const noSettings = { ...room(), settings: undefined } as unknown as TRoom;
        await render(
            <RoomCard
                room={noSettings}
                isCurrent
                permissions={{ ...permissions, canDelete: false, canEditSettings: false }}
                {...handlers}
                onSettings={jest.fn()}
            />,
        );
        expect(screen.getByText('Settings: Card powers shown · Red backs')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'View settings of room Pub' })).toBeTruthy();
    });

    it('has no settings button for rooms the user is not in', async () => {
        await render(
            <RoomCard
                room={room()}
                isCurrent={false}
                permissions={{ ...permissions, canDelete: false, canViewSettings: false, canEditSettings: false }}
                {...handlers}
                onSettings={jest.fn()}
            />,
        );
        expect(screen.queryByRole('button', { name: /settings of room/ })).toBeNull();
    });
});

describe('useRoomSettings', () => {
    async function setup(rooms: TRooms, roomId?: number) {
        const store = configureStore({ reducer: { user: userReducer, rooms: roomsReducer } });
        store.dispatch(setUser({ id: 1, username: 'me' }));
        store.dispatch(setRooms(rooms));
        const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
        return renderHook(() => useRoomSettings(roomId), { wrapper });
    }

    it('returns the defaults for an unknown room', async () => {
        const { result } = await setup({}, 3);
        expect(result.current).toEqual({ showCardPowers: true, cardBack: 'red' });
    });

    it('returns the settings of a room by id', async () => {
        const { result } = await setup({ 3: room() }, 3);
        expect(result.current).toEqual({ showCardPowers: false, cardBack: 'blue' });
    });

    it('returns the settings of the current room without an id', async () => {
        const { result } = await setup({ 1: room({ owner: 'x', players: [], settings: { showCardPowers: true, cardBack: 'red' } }), 2: room() });
        expect(result.current).toEqual({ showCardPowers: false, cardBack: 'blue' });
    });
});
