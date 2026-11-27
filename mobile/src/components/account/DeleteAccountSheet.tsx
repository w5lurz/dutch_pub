import { useState } from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BottomSheet, Button, TextField } from '@/components/ui';

export type DeleteAccountSheetProps = {
    visible: boolean;
    onClose: () => void;
    /** Deletes the account (`useSession().deleteAccount`); resolves with an error message, or null once deleted. */
    onDelete: (password: string) => Promise<string | null>;
};

/** Asks for the password, then deletes the logged-in user's account for good. */
export function DeleteAccountSheet({ visible, onClose, onDelete }: DeleteAccountSheetProps) {
    const { t } = useTranslation();
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
        <BottomSheet visible={visible} title={t('account.deleteAccount')} onClose={close}>
            <Text className="text-base text-gray-700">
                {t('account.deleteExplanation')}
            </Text>
            <TextField
                label={t('auth.password')}
                placeholder={t('account.deletePasswordPlaceholder')}
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
            <Button label={t('account.deleteMyAccount')} variant="red" onPress={handleDelete} disabled={!password} loading={deleting} className="w-full" />
            <Button label={t('account.keepMyAccount')} variant="gray" onPress={close} disabled={deleting} className="w-full" />
        </BottomSheet>
    );
}

export default DeleteAccountSheet;
