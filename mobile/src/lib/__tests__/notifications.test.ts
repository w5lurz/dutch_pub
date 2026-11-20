import * as Notifications from 'expo-notifications';

import { forgetPush, registerForPush, setNotificationsOn } from '../notifications';

jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(async () => 'x.e30.sig'),
    setItemAsync: jest.fn(async () => {}),
    deleteItemAsync: jest.fn(async () => {}),
}));
jest.mock('../deviceSettings', () => ({
    getDeviceSetting: jest.fn(async () => null),
    setDeviceSetting: jest.fn(async () => {}),
}));

const respond = (status: number) => Promise.resolve({ ok: status >= 200 && status < 300, status, json: async () => ({}) } as Response);
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('push notifications', () => {
    const fetchMock = jest.fn();
    beforeEach(async () => {
        fetchMock.mockReset();
        fetchMock.mockImplementation(() => respond(204));
        globalThis.fetch = fetchMock;
        await forgetPush();
        fetchMock.mockClear();
        jest.mocked(Notifications.getPermissionsAsync).mockClear();
        jest.mocked(Notifications.requestPermissionsAsync).mockClear();
    });

    const calls = () => fetchMock.mock.calls.map(([url, init]) => [init.method, String(url).replace(/^.*\/api/, '/api'), JSON.parse(init.body)]);

    it("gives this phone's token to the server, and takes it back", async () => {
        await registerForPush();
        expect(calls()).toEqual([['PUT', '/api/users/me/push-token', { token: 'ExponentPushToken[test]' }]]);
        fetchMock.mockClear();
        await forgetPush();
        expect(calls()).toEqual([['DELETE', '/api/users/me/push-token', { token: 'ExponentPushToken[test]' }]]);
    });

    it('asks for the permission only when told to', async () => {
        jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'undetermined', canAskAgain: true } as never);
        jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValueOnce({ status: 'denied', canAskAgain: false } as never);
        await registerForPush();
        expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
        await registerForPush({ ask: true });
        expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
        expect(fetchMock).not.toHaveBeenCalled();
        jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'granted', canAskAgain: true } as never);
    });

    it('the switch: off forgets the token, on registers again', async () => {
        await registerForPush();
        fetchMock.mockClear();
        setNotificationsOn(false);
        await flush();
        expect(calls().map(([method]) => method)).toEqual(['DELETE']);
        fetchMock.mockClear();
        await registerForPush();
        expect(fetchMock).not.toHaveBeenCalled();
        setNotificationsOn(true);
        await flush();
        await flush();
        expect(calls().map(([method]) => method)).toEqual(['PUT']);
    });
});
