import { useState } from 'react';
import { Text } from 'react-native';

import { BottomSheet, Button, TextField } from '@/components/ui';

export type DeleteAccountSheetProps = {
    visible: boolean;
    onClose: () => void;
    /** Deletes the account (`useSession().deleteAccount`); resolves with an error message, or null once deleted. */
    onDelete: (password: string) => Promise<string | null>;
};

/** Asks for the password, then deletes the logged-in user's account for good. */
export function DeleteAccountSheet({ visible, onClose, onDelete }: DeleteAccountSheetProps) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const close = () => {
        setPassword('');
        setError(null);
        onClose();
    };

    const handleDelete = async () => {
        setDeleting(true);
        const message = await onDelete(password);
        setDeleting(false);
        if (message) setError(message);
        else close();
    };

    return (
        <BottomSheet visible={visible} title="Delete account" onClose={close}>
            <Text className="text-base text-gray-700">
                Your account, avatar and logins are deleted for good. In past games your name becomes “[deleted]”, so the other
                players keep their results. This cannot be undone.
            </Text>
            <TextField
                label="Password"
                placeholder="Your password, to confirm"
                value={password}
                onChangeText={text => {
                    setPassword(text);
                    setError(null);
                }}
                secureTextEntry
                revealable
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                textContentType="password"
                error={error}
                editable={!deleting}
            />
            <Button label="Delete my account" variant="red" onPress={handleDelete} disabled={!password} loading={deleting} className="w-full" />
            <Button label="Keep my account" variant="gray" onPress={close} disabled={deleting} className="w-full" />
        </BottomSheet>
    );
}

export default DeleteAccountSheet;
