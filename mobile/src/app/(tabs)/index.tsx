import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DutchPubLogo } from '@/components/icons';
import { Screen } from '@/components/ui';
import { AboutSection, CardsSection, HowTheGameWorksSection, SectionHeading, Title, WelcomeActions } from '@/components/welcome';

/** Home tab: the web's Welcome page (about, how the game works, card rules). */
export default function HomeScreen() {
    const { t } = useTranslation();
    return (
        <Screen scroll background="gray" contentClassName="pb-16">
            <View className="my-4 items-center gap-2">
                <DutchPubLogo size={64} />
                <Title>Dutch Pub</Title>
            </View>

            {/* <WelcomeActions className="mb-2" /> */}

            <AboutSection />
            <HowTheGameWorksSection />
            <CardsSection />

            <SectionHeading className="mt-8 text-center">{t('home.outro')}</SectionHeading>
            <WelcomeActions className="mt-4" />
        </Screen>
    );
}
