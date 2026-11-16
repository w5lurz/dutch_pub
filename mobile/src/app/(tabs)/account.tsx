import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import { GuestBadge } from '@/components/auth';
import { DutchPubLogo } from '@/components/icons';
import { Button, Screen } from '@/components/ui';
import { useSession } from '@/hooks/useSession';
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
	const { logOut } = useSession();
	const [loggingOut, setLoggingOut] = useState(false);

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
					<View className="h-24 w-24 items-center justify-center rounded-full bg-gray-700">
						<DutchPubLogo size={56} />
					</View>
					<Text accessibilityRole="header" className="text-2xl font-bold text-gray-900">
						{user.username}
					</Text>
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
				</View>
			) : (
				<SignedOut />
			)}
		</Screen>
	);
}
