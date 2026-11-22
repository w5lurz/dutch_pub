/**
 * Minimum app version. Phones keep old app versions for as long as their owners like; when the
 * server changes in a way an old version can't follow, set MIN_APP_VERSION (e.g. 1.1.0) once the new
 * version is in the store. Older apps are then refused (REST: 426, socket: "update required") and
 * show an "Update the app" screen. The app sends its version (app.json `version`) as the
 * `X-App-Version` header and as `appVersion` in the socket handshake. Apps from before this check
 * send none: they count as older than any minimum. Unset: no check.
 */

/** "1.2.3" -> [1, 2, 3]; null when it isn't a version. */
const parts = version => {
    if (typeof version !== 'string' || !/^\d{1,5}(\.\d{1,5}){0,2}$/.test(version.trim())) return null;
    const [major = 0, minor = 0, patch = 0] = version.trim().split('.').map(Number);
    return [major, minor, patch];
};

/** Negative when `a` is older than `b`, 0 when the same, positive when newer. */
export const compareVersions = (a, b) => {
    const [x, y] = [parts(a), parts(b)];
    for (let i = 0; i < 3; i++) {
        if (x[i] !== y[i]) return x[i] - y[i];
    }
    return 0;
};

/** The configured minimum, or null (no check; also when MIN_APP_VERSION isn't a version). */
export const minAppVersion = () => {
    const min = process.env.MIN_APP_VERSION;
    if (!min) return null;
    if (!parts(min)) {
        console.error(`MIN_APP_VERSION "${min}" is not a version like 1.2.0: no version check.`);
        return null;
    }
    return min.trim();
};

/** Whether an app reporting `version` must be updated first (missing or garbled = an old app). */
export const isOutdated = (version, min = minAppVersion()) => {
    if (!min) return false;
    if (!parts(version)) return true;
    return compareVersions(version, min) < 0;
};

export const UPDATE_REQUIRED = 'Please update the app to keep playing.';

/** Express: refuses the app's API calls from outdated versions (the health check stays open). */
export const requireAppVersion = (req, res, next) => {
    if (req.path === '/health' || !isOutdated(req.get('X-App-Version'))) return next();
    res.status(426).send({ message: UPDATE_REQUIRED, code: 'UPDATE_REQUIRED', minVersion: minAppVersion() });
};

/** Socket.io: refuses connections from outdated versions before anything else runs. */
export const socketAppVersion = io => {
    io.use((socket, next) => {
        if (isOutdated(socket.handshake.auth?.appVersion)) return next(new Error('update required'));
        next();
    });
};
