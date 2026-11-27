import type { ReactNode } from 'react';
import { Text } from 'react-native';
import { Trans } from 'react-i18next';
import { render, screen } from '@testing-library/react-native';

function Marked({ children }: { children?: ReactNode }) {
    return <Text testID="marked">{children}</Text>;
}

// Markers in the texts must wrap their words. HTML void tag names (`link`, `br`, `img`...) don't:
// the words end up outside, so the privacy link in the registration sentence was plain text.
it.each([
    ['auth.agreePrivacy', 'url', 'Privacy policy'],
    ['home.how.hand', 'b', 'Hand'],
])('%s: <%s> wraps its words', async (key, marker, words) => {
    await render(
        <Text>
            <Trans i18nKey={key as never} components={{ [marker]: <Marked /> }} />
        </Text>,
    );
    expect(screen.getByTestId('marked')).toHaveTextContent(words);
});
