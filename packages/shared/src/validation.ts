// Rules for names, emails and passwords: checked by the server (signup, joining as a guest) and
// usable by the app's forms, so both say the same thing.

export const USERNAME_MIN = 2;
export const USERNAME_MAX = 20;
export const PASSWORD_MIN = 8;
/** bcrypt only looks at the first 72 bytes of a password. */
export const PASSWORD_MAX_BYTES = 72;
export const EMAIL_MAX = 254;

// Letters (any language), digits, and single spaces, "_", "." or "-" between them; starts and
// ends with a letter or digit. No commas (played games store names comma-separated) and no
// brackets ("[deleted]" stands for deleted accounts).
const USERNAME_PATTERN = /^[\p{L}\p{N}](?:[\p{L}\p{N}_.-]| (?! ))*$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Why `name` (already trimmed by the caller, or not) can't be a username, or null if it can. */
export function usernameError(name: unknown): string | null {
    if (typeof name !== 'string' || !name.trim()) return 'Please choose a username.';
    const trimmed = name.trim();
    if (trimmed.length < USERNAME_MIN || trimmed.length > USERNAME_MAX) {
        return `A username has ${USERNAME_MIN} to ${USERNAME_MAX} characters.`;
    }
    // Names like "constructor" or "toString" would look like built-in properties of the
    // server's lookup objects.
    if (!USERNAME_PATTERN.test(trimmed) || /[_.-]$/.test(trimmed) || trimmed in Object.prototype) {
        return 'Use letters, numbers, spaces, "_", "." or "-", starting and ending with a letter or number.';
    }
    return null;
}

/** Why `email` can't be used, or null. */
export function emailError(email: unknown): string | null {
    if (typeof email !== 'string' || email.length > EMAIL_MAX || !EMAIL_PATTERN.test(email.trim())) {
        return 'Please give a valid email address.';
    }
    return null;
}

/** Why `password` can't be used for a new account, or null. */
export function passwordError(password: unknown): string | null {
    if (typeof password !== 'string' || password.length < PASSWORD_MIN) {
        return `The password needs at least ${PASSWORD_MIN} characters.`;
    }
    if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) return 'The password is too long.';
    return null;
}
