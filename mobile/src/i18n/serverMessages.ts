import i18n from 'i18next';

import type en from './locales/en';

// The server (and the shared validators) answer in English. The app shows those messages in its
// own language when it knows them; an unknown one (a newer server) is shown as it came.
// Keep in sync with the backend's messages (`backend/src`, `packages/shared/src/validation.ts`).

type ServerKey = keyof (typeof en)['server'];
/** `t` without the key typing, for keys built at runtime (checked by the maps' types). */
const loose = i18n as unknown as { t: (key: string, options?: Record<string, string>) => string };

const EXACT: Record<string, ServerKey> = {
    'A room has 2, 3 or 4 seats.': 'roomSeats',
    'A room is public or private.': 'roomVisibility',
    'At least 2 players are needed to start.': 'twoPlayersNeeded',
    'Cards can only be swapped before the game starts.': 'swapBeforeStart',
    'Guests cannot choose an avatar. Log in to choose one.': 'guestAvatar',
    'Guests cannot create rooms. Log in to create one.': 'guestCreateRoom',
    'Guests cannot join private rooms.': 'guestPrivateRoom',
    'Guests have no account to delete.': 'guestDelete',
    'Invalid Password!': 'invalidPassword',
    'Invalid request.': 'invalidRequest',
    'It is not your turn.': 'notYourTurn',
    'No user with this username found.': 'noSuchUser',
    'Only cards of the same value can be laid together.': 'sameValue',
    'Only the room owner can do that.': 'ownerOnly',
    'Password reset is not set up on this server yet.': 'resetNotSetUp',
    'Please choose a username.': 'chooseUsername',
    'Please choose an avatar.': 'chooseAvatar',
    'Please give a valid email address.': 'invalidEmail',
    'Please give your username and password.': 'usernameAndPassword',
    'Registration Failed! Email is already in use!': 'emailInUse',
    'Registration Failed! Username is already in use!': 'usernameInUse',
    'Request too large.': 'requestTooLarge',
    'Settings cannot be changed after the game has started.': 'settingsLocked',
    'Slow down a little.': 'slowDown',
    'Something went wrong. Please try again later.': 'somethingWrongLater',
    'Something went wrong. Please try again.': 'somethingWrong',
    'Swap your cards first, then tap Ready.': 'swapFirst',
    'That card does not exist.': 'noSuchCard',
    'The game has not started.': 'gameNotStarted',
    'The game has started already.': 'gameStarted',
    'The game in this room has started already.': 'roomGameStarted',
    'The game is running; stop it instead.': 'gameRunningStop',
    'The owner cannot leave the room; delete it instead.': 'ownerCannotLeave',
    'The password is too long.': 'passwordTooLong',
    'The server is full right now. Please try again in a few minutes.': 'serverFull',
    'The two passwords are not the same.': 'passwordsDiffer',
    'This game does not exist.': 'noSuchGame',
    'This room does not exist.': 'noSuchRoom',
    'This room is full.': 'roomFull',
    'This username is already taken!': 'usernameTaken',
    'Too many attempts. Please wait a few minutes and try again.': 'tooManyAttempts',
    'Unauthorized!': 'unauthorized',
    'Unknown avatar.': 'unknownAvatar',
    'Use letters, numbers, spaces, "_", "." or "-", starting and ending with a letter or number.': 'usernameCharacters',
    'Wait a moment before the next message.': 'chatWait',
    'Wait a moment, the pile is being picked up.': 'pileBeingPickedUp',
    'Wrong password.': 'wrongPassword',
    'You are in a room already.': 'inRoomAlready',
    'You are in a running game. You can delete your account once it is over.': 'deleteInGame',
    'You are not a player in this game.': 'notAPlayer',
    'You are not in this room.': 'notInRoom',
    'You are ready already.': 'readyAlready',
    'You can only act as yourself.': 'actAsYourself',
    'You cannot lay that card.': 'cannotLay',
    'You cannot leave a running game.': 'cannotLeaveGame',
    'You have to play your other cards first.': 'otherCardsFirst',
    'You need to log in or join as a guest first.': 'logInFirst',
    'Your session has expired. Please log in again.': 'sessionExpired',
};

const PATTERNS: [RegExp, ServerKey, (match: RegExpMatchArray) => Record<string, string>][] = [
    [/^A message has 1 to (\d+) characters\.$/, 'chatLength', m => ({ max: m[1] })],
    [/^A username has (\d+) to (\d+) characters\.$/, 'usernameLength', m => ({ min: m[1], max: m[2] })],
    [/^The password needs at least (\d+) characters\.$/, 'passwordLength', m => ({ min: m[1] })],
    [/^Please give the room a name \(at most (\d+) characters\)\.$/, 'roomName', m => ({ max: m[1] })],
    [/^If an account uses this email, a link to set a new password is on its way\. It works for (\d+) minutes\.$/, 'resetSent', m => ({ minutes: m[1] })],
    [/^Registration Failed! (.+)$/, 'registrationFailed', m => ({ reason: serverMessage(m[1]) })],
    [/^Leave the room "(.+)" first, then delete your account\.$/, 'leaveRoomFirst', m => ({ room: m[1] })],
];

/** `message` (English, from the server or a shared validator) in the app's language, when known. */
export function serverMessage(message: string): string;
export function serverMessage(message: string | null | undefined): string | null;
export function serverMessage(message: string | null | undefined): string | null {
    if (!message) return message ?? null;
    const key = EXACT[message];
    if (key) return loose.t(`server.${key}`);
    for (const [pattern, patternKey, params] of PATTERNS) {
        const match = message.match(pattern);
        if (match) return loose.t(`server.${patternKey}`, params(match));
    }
    return message;
}
