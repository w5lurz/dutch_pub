import { Link } from 'react-router-dom';

export default function Welcome() {
    return (
        <div className="bg-gray-50 dark:bg-gray-900 h-full dark:text-white p-6 text-gray-800">
            <h1 className="text-center text-2xl font-semibold my-4">Dutch Card</h1>

            <h5 className="text-xl font-semibold">About</h5>
            <p className="text-base my-2">
                This App is a socket-based Multiplayer Card Game. You can create rooms, delete it, join them, leave them, start them and
                play the game. To play a game you do not necessary need to create an account, you can play as a guest too. On the
                Leaderboard page you can check the most successful players and their favourite friend. After logging in your session will be
                saved for an hour so don&apos;t forget to Log out! Player games with your friends and try to win!
            </p>

            <div className="my-8">
                <div className="my-8">
                    <h5 className="text-xl font-semibold">How the game works</h5>
                    <p className="text-base my-2">
                        The game starts as soon as the creator of the room hits the Start button. After that all players in that room will
                        be redirected to the Game page.
                    </p>
                    <h6 className="text-base font-semibold">Start</h6>
                    <p className="text-base my-2">
                        A deck or decks of french card will get randomly sorted (depending on how many of you are playing). When the game
                        starts a random player will be assigned as the first one to lay a card. Everyone will get some cards to start with:
                        <ul className="list-disc ml-6 my-4">
                            <li>
                                <strong>Hand</strong> - 3 cards to your hand
                            </li>
                            <li>
                                <strong>Flipped on Table</strong> - 3 cards to the desk flipped, which you cannot see or play before your
                                hand and your cards on top of these are all played
                            </li>
                            <li>
                                <strong>Table</strong> - 3 cards to your Flipped on Table cards, which everyone can see but cannot be played
                                before your hand gets empty
                            </li>
                        </ul>
                    </p>
                    <h6 className="text-base font-semibold">Laying a card</h6>
                    <p className="text-base my-2">
                        Every card has a value and some of them are Magic Cards - and there is the Tease card. There are several rules which
                        cards can be placed on which cards but the basic rule is that you must play a card which has at least the minimum
                        value of the latest laid card.
                    </p>
                    <h6 className="text-base font-semibold">Basic rules</h6>
                    <ul className="list-disc ml-6 my-4">
                        <li>You must always place a card if you can.</li>
                        <li>
                            If 4 cards of the same value is placed on laid cards on top of each other all the laid cards will get to the
                            burnt cards too.
                        </li>
                        <li>
                            If you cannot place any of your cards to the latest laid card you pick all of them up to your hand. Your turn is
                            skipped, the next player is up.
                        </li>
                        <li>
                            Your <strong>Flipped on Table</strong> cards can only be played after the deck and your hand got empty too!
                        </li>
                        <li>
                            Your <strong>Table</strong> cards can only be played after the deck, your <strong>Hand</strong> and your{' '}
                            <strong>Flipped on Table</strong> cards got empty too!
                        </li>
                        <li>The first player to place all of their cards wins the game.</li>
                    </ul>
                </div>
                <h5 className="text-xl font-semibold">Cards</h5>
                <p className="text-base my-2">Here you can read the description of the cards of the deck.</p>
                <h6 className="text-base font-semibold">Magic Cards</h6>
                <ul className="list-disc ml-6 my-4">
                    <li>
                        <strong>2 - Start Over</strong> - Can be placed on every Magic Card and every simple card but not on the Tease Card.
                        You can place any card on it.
                    </li>
                    <li>
                        <strong>8 - Mirror</strong> - Can be placed on every Magic Card and every simple card but not on the Tease Card.
                        It&apos;s value will be the latest card&apos;s value. If the latest card was also an 8 then it&apos;s value is the
                        card placed before that. The basic rule applies here: you can only place a card on the 8 that has at least the
                        minimum value of it&apos; calculated value.
                    </li>
                    <li>
                        <strong>10 - Clear All</strong> - Can be placed on every Magic Card and every simple card but not on the Tease Card.
                        Clears the laid cards and all of it get&apos;s to the burnt cards. Your turn again!
                    </li>
                    <li>
                        <strong>Ace (14) - Call Next</strong> - Can be placed on every Magic Card and every simple card but not on the Tease
                        Card. The next player must place a Magic Card on it - so you can only place a Magic Card on it.
                    </li>
                </ul>
                <h6 className="text-base font-semibold">Tease Card</h6>
                <ul className="list-disc ml-6 my-4">
                    <li>
                        <strong>9 - You Lose</strong> - Can be placed on any card which has a maximum value of 7. You can only place cards
                        with values between 3 and 7 on it!
                    </li>
                </ul>
                <h6 className="text-base font-semibold">Simple Cards</h6>
                <ul className="list-disc ml-6 my-4">
                    <li>
                        <strong>3</strong> - Can be placed on any card which has a maximum value of 3.
                    </li>
                    <li>
                        <strong>4</strong> - Can be placed on any card which has a maximum value of 4.
                    </li>
                    <li>
                        <strong>5</strong> - Can be placed on any card which has a maximum value of 5.
                    </li>
                    <li>
                        <strong>6</strong> - Can be placed on any card which has a maximum value of 6.
                    </li>
                    <li>
                        <strong>7</strong> - Can be placed on any card which has a maximum value of 7.
                    </li>
                    <li>
                        <strong>J (11)</strong> - Can be placed on any card which has a maximum value of 11.
                    </li>
                    <li>
                        <strong>Q (12)</strong> - Can be placed on any card which has a maximum value of 12.
                    </li>
                    <li>
                        <strong>K (13)</strong> - Can be placed on any card which has a maximum value of 13.
                    </li>
                </ul>
            </div>
            <h5 className="text-xl font-semibold">
                Now you know everything you need to know. Go let&apos;s <Link to="/play">Play!</Link>
            </h5>
        </div>
    );
}
