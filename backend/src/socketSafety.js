// Protects the server from what clients send over Socket.io.
//
// Socket.io runs event handlers without catching their errors, so a single malformed payload
// (no payload, a string instead of an object, ...) used to crash the whole server: anyone
// could stop every game with one line. `guardHandlers` catches what a handler throws (or an
// async one rejects with), `limitEvents` drops floods from one connection.

/** Events one connection may send per second; more are dropped (a burst far above it disconnects). */
const EVENTS_PER_SECOND = Number(process.env.SOCKET_EVENTS_PER_SECOND ?? 20);

const report = (socket, event, error) => {
    console.log('SOCKET HANDLER FAILED', event, error?.message ?? error);
    socket.emit('action-rejected', 'Something went wrong. Please try again.');
};

/**
 * Wraps every handler registered with `socket.on` afterwards, so an error in one only answers
 * that client with `action-rejected`. Register it before the other connection handlers.
 */
export const guardHandlers = io => {
    io.on('connection', socket => {
        const on = socket.on.bind(socket);
        socket.on = (event, handler) =>
            on(event, (...args) => {
                try {
                    const result = handler(...args);
                    if (result && typeof result.catch === 'function') result.catch(error => report(socket, event, error));
                } catch (error) {
                    report(socket, event, error);
                }
            });
    });
};

/** Drops a connection's events beyond `EVENTS_PER_SECOND`, and disconnects a flood. */
export const limitEvents = io => {
    io.on('connection', socket => {
        let windowStart = Date.now();
        let count = 0;
        socket.use((packet, next) => {
            const now = Date.now();
            if (now - windowStart >= 1000) {
                windowStart = now;
                count = 0;
            }
            count += 1;
            if (count <= EVENTS_PER_SECOND) return next();
            if (count === EVENTS_PER_SECOND + 1) socket.emit('action-rejected', 'Slow down a little.');
            if (count > EVENTS_PER_SECOND * 5) socket.disconnect(true);
        });
    });
};
