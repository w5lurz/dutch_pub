import { Text, View } from 'react-native';

import { Bullet, BulletList, Paragraph, SectionHeading, Strong, SubHeading } from './Typography';

// Copy ported from the former web app (frontend/src/components/Welcome/Welcome.tsx, removed; see git history), obvious typos fixed.

export function AboutSection() {
    return (
        <View>
            <SectionHeading className="mt-2">About</SectionHeading>
            <Paragraph>
                This App is a socket-based Multiplayer Card Game. You can create rooms, delete it, join them, leave them, start them and
                play the game. To play a game you do not necessary need to create an account, you can play as a guest too. On the
                Leaderboard page you can check the most successful players and their favourite friend. After logging in your session will
                be saved for an hour so don&apos;t forget to Log out! You can even chat with your friends while playing. Play games with
                even your 3 friends and try to win!
            </Paragraph>
        </View>
    );
}

export function HowTheGameWorksSection() {
    return (
        <View>
            <SectionHeading>How the game works</SectionHeading>
            <Paragraph>
                The game starts as soon as the creator of the room hits the Start button. After that all players in that room will be
                redirected to the Game page.
            </Paragraph>

            <SubHeading>Start</SubHeading>
            <Paragraph>
                A deck or decks of french card will get randomly sorted (depending on how many of you are playing). When the game starts a
                random player will be assigned as the first one to lay a card. Everyone will get some cards to start with:
            </Paragraph>
            <BulletList>
                <Bullet>
                    <Strong>Hand</Strong> - 3 cards to your hand
                </Bullet>
                <Bullet>
                    <Strong>Flipped on Table</Strong> - 3 cards onto your Table cards, which everyone can see but cannot be played before
                    your hand gets empty
                </Bullet>
                <Bullet>
                    <Strong>Table</Strong> - 3 cards to the desk flipped, which you cannot see or play before your hand and your cards on top
                    of these are all played
                </Bullet>
            </BulletList>

            <SubHeading>Laying a card</SubHeading>
            <Paragraph>
                Every card has a value and some of them are Magic Cards - and there is the Tease card. There are several rules which cards
                can be placed on which cards but the basic rule is that you must play a card which has at least the minimum value of the
                latest laid card.
            </Paragraph>

            <SubHeading>Basic rules</SubHeading>
            <BulletList>
                <Bullet>You must always place a card if you can.</Bullet>
                <Bullet>
                    If 4 cards of the same value is placed on laid cards on top of each other all the laid cards will get to the burnt cards
                    too.
                </Bullet>
                <Bullet>
                    If you cannot place any of your cards to the latest laid card you pick all of them up to your hand. Your turn is
                    skipped, the next player is up.
                </Bullet>
                <Bullet>
                    Your <Strong>Flipped on Table</Strong> cards can only be played after the deck and your hand got empty too!
                </Bullet>
                <Bullet>
                    Your <Strong>Table</Strong> cards can only be played after the deck, your <Strong>Hand</Strong> and your{' '}
                    <Strong>Flipped on Table</Strong> cards got empty too!
                </Bullet>
                <Bullet>The first player to place all of their cards wins the game.</Bullet>
            </BulletList>
        </View>
    );
}

const simpleCards: readonly { label: string; max: number }[] = [
    { label: '3', max: 3 },
    { label: '4', max: 4 },
    { label: '5', max: 5 },
    { label: '6', max: 6 },
    { label: '7', max: 7 },
    { label: 'J (11)', max: 11 },
    { label: 'Q (12)', max: 12 },
    { label: 'K (13)', max: 13 },
];

export function CardsSection() {
    return (
        <View>
            <SectionHeading>Cards</SectionHeading>
            <Paragraph>Here you can read the description of the cards of the deck.</Paragraph>

            <SubHeading>Magic Cards</SubHeading>
            <BulletList>
                <Bullet>
                    <Strong>2 - Start Over</Strong> - Can be placed on every Magic Card and every simple card but not on the Tease Card. You
                    can place any card on it.
                </Bullet>
                <Bullet>
                    <Strong>8 - Mirror</Strong> - Can be placed on every Magic Card and every simple card but not on the Tease Card. Its
                    value will be the latest card&apos;s value. If the latest card was also an 8 then its value is the card placed before
                    that. The basic rule applies here: you can only place a card on the 8 that has at least the minimum value of its
                    calculated value.
                </Bullet>
                <Bullet>
                    <Strong>10 - Clear All</Strong> - Can be placed on every Magic Card and every simple card but not on the Tease Card.
                    Clears the laid cards and all of it gets to the burnt cards. Your turn again!
                </Bullet>
                <Bullet>
                    <Strong>Ace (14) - Call Next</Strong> - Can be placed on every Magic Card and every simple card but not on the Tease
                    Card. The next player must place a Magic Card on it - so you can only place a Magic Card on it.
                </Bullet>
            </BulletList>

            <SubHeading>Tease Card</SubHeading>
            <BulletList>
                <Bullet>
                    <Strong>9 - You Lose</Strong> - Can be placed on any card which has a maximum value of 7. You can only place cards with
                    values between 3 and 7 on it!
                </Bullet>
            </BulletList>

            <SubHeading>Simple Cards</SubHeading>
            <BulletList>
                {simpleCards.map(card => (
                    <Bullet key={card.label}>
                        <Strong>{card.label}</Strong>
                        <Text> - Can be placed on any card which has a maximum value of {card.max}.</Text>
                    </Bullet>
                ))}
            </BulletList>
        </View>
    );
}
