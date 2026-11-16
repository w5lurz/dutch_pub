import { View } from 'react-native';

import { DutchPubLogo } from '@/components/icons';
import { Screen } from '@/components/ui';
import { AboutSection, CardsSection, HowTheGameWorksSection, SectionHeading, Title, WelcomeActions } from '@/components/welcome';

/** Home tab: the web's Welcome page (about, how the game works, card rules). */
export default function HomeScreen() {
    return (
        <Screen scroll background="gray" contentClassName="pb-8">
            <View className="my-4 items-center gap-2">
                <DutchPubLogo size={64} />
                <Title>Dutch Card</Title>
            </View>

            <WelcomeActions className="mb-2" />

            <AboutSection />
            <HowTheGameWorksSection />
            <CardsSection />

            <SectionHeading className="mt-8">Now you know everything you need to know. Go let&apos;s Play!</SectionHeading>
            <WelcomeActions className="mt-4" />
        </Screen>
    );
}
