import { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { router } from 'expo-router';

import { AvatarSection } from '@/components/account/AvatarSection';
import { DeleteAccountSheet } from '@/components/account/DeleteAccountSheet';
import { GuestBadge } from '@/components/auth';
import { DutchPubLogo } from '@/components/icons';
import { Button, Screen, SettingRow, TextLink } from '@/components/ui';
import { useSession } from '@/hooks/useSession';
import { PRIVACY_URL } from '@/lib/config';
import { setNotificationsOn, useNotificationsOn } from '@/lib/notifications';
import { setSoundsOn, useSoundsOn } from '@/lib/sounds';
import { useAppDispatch, useAppSelector } from '@/store';
import { setToast } from '@/store/generalSlice';

function SignedOut() {
	return (
		<View className="w-full max-w-md items-center gap-4">
			<DutchPubLogo size={64} />
			<Text accessibilityRole="header" className="text-2xl font-bold text-gray-900">
				You are not logged in
			</Text>
			<Text className="text-center text-base text-gray-600">
				Log in or create an account to keep track of your wins.
			</Text>
			<View className="w-full gap-3">
				<Button label="Log in" variant="blue" onPress={() => router.push('/login')} className="w-full" />
				<Button label="Register" variant="green" onPress={() => router.push('/registration')} className="w-full" />
			</View>
			<View className="mt-4 w-full items-center gap-2 border-t border-gray-200 pt-4">
				<Text className="text-center text-sm text-gray-500">
					No account needed to play: you can also join as a guest from the Play tab.
				</Text>
				<Button label="Play as guest" variant="gray" size="sm" onPress={() => router.navigate('/play')} />
			</View>
		</View>
	);
}

export default function AccountScreen() {
	const user = useAppSelector((state) => state.user);
	const dispatch = useAppDispatch();
	const { logOut, deleteAccount } = useSession();
	const [loggingOut, setLoggingOut] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const soundsOn = useSoundsOn();
	const notificationsOn = useNotificationsOn();

	const handleDelete = async (password: string) => {
		const result = await deleteAccount(password);
		if (!result.ok) return result.message;
		dispatch(
			setToast({ id: `account-deleted-${Date.now()}`, type: 'info', message: 'Your account has been deleted.', duration: 4000 }),
		);
		return null;
	};

	const handleLogout = async () => {
		setLoggingOut(true);
		try {
			await logOut();
			dispatch(
				setToast({
					id: `logout-success-${Date.now()}`,
					type: 'success',
					message: 'You successfully logged out!',
					duration: 3000,
				}),
			);
		} catch (e) {
			dispatch(setToast({ id: `logout-failed-${Date.now()}`, type: 'error', message: String(e), duration: 3000 }));
		} finally {
			setLoggingOut(false);
		}
	};

	return (
		<Screen scroll background="gray" contentClassName="items-center justify-center">
			{user ? (
				<View className="w-full max-w-md items-center gap-3 rounded-lg border border-gray-200 bg-white p-6 shadow">
					<Text accessibilityRole="header" className="text-2xl font-bold text-gray-900">
						{user.username}
					</Text>
					<AvatarSection user={user} />
					{user.isGuest ? <GuestBadge /> : null}
					{!user.isGuest && user.email ? <Text className="text-base text-gray-600">{user.email}</Text> : null}
					{user.isGuest ? (
						<Text className="text-center text-sm text-gray-500">Guest users can only join public rooms.</Text>
					) : null}
					{/* As on the web (menu hidden in game), no logging out in the middle of a game. */}
					{user.inGame !== undefined ? (
						<Text className="mt-2 text-center text-sm text-gray-500">You can log out once your game is over.</Text>
					) : (
						<Button label="Log out" variant="red" onPress={handleLogout} loading={loggingOut} className="mt-2 w-full" />
					)}
					{!user.isGuest ? (
						<>
							<Button
								label="Delete account"
								variant="gray"
								size="sm"
								onPress={() => setDeleting(true)}
								className="mt-2"
							/>
							<DeleteAccountSheet visible={deleting} onClose={() => setDeleting(false)} onDelete={handleDelete} />
						</>
					) : null}
				</View>
			) : (
				<SignedOut />
			)}
			{/* Settings of this phone only (not of the account). */}
			<View className="mt-4 w-full max-w-md rounded-lg border border-gray-200 bg-white px-4 py-2 shadow">
				<SettingRow
					label="Sounds"
					description="Card, pick-up, burn and win sounds in a game (silent when the phone is)"
					value={soundsOn}
					onValueChange={setSoundsOn}
				/>
				<SettingRow
					label="Notifications"
					description="“Your turn” when Dutch Pub is in the background"
					value={notificationsOn}
					onValueChange={setNotificationsOn}
				/>
			</View>
			<TextLink
				label="Privacy policy"
				hint="Opens in the browser"
				onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})}
				className="mt-4"
			/>
			{__DEV__ ? (
				<View className="mt-6 flex-row flex-wrap justify-center gap-2">
					<Button label="Table preview (dev)" variant="gray" size="sm" onPress={() => router.push('/dev/table')} />
					<Button label="Card preview (dev)" variant="gray" size="sm" onPress={() => router.push('/dev/cards')} />
					<Button label="Avatars (dev)" variant="gray" size="sm" onPress={() => router.push('/dev/avatars')} />
				</View>
			) : null}
		</Screen>
	);
}
