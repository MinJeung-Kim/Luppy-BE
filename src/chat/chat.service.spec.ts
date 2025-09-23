/// <reference types="jest" />
import { ChatService } from './chat.service';

describe('ChatService (다중 소켓 지원)', () => {
    let service: ChatService;

    beforeEach(() => {
        // Create service with minimal mocked repositories since socket-map logic doesn't use them
        // @ts-expect-error constructor mocks
        service = new ChatService(undefined, undefined);
    });

    function makeSocket(id: string, userId?: number) {
        // Minimal mock socket
        const socket: any = {
            id,
            data: { user: userId ? { sub: userId } : undefined },
            join: jest.fn(),
            emit: jest.fn(),
            to: jest.fn(() => ({ emit: jest.fn() })),
        };
        return socket as any;
    }

    test('registerClient는 단일 소켓을 저장하고 getSocketsByUser는 이를 반환해야 한다', () => {
        const s1 = makeSocket('s1', 10);
        service.registerClient(10, s1);

        const sockets = service.getSocketsByUser(10);
        expect(sockets).toHaveLength(1);
        expect(sockets[0].id).toBe('s1');
    });

    test('registerClient는 사용자당 여러 소켓을 지원해야 한다', () => {
        const s1 = makeSocket('s1', 11);
        const s2 = makeSocket('s2', 11);
        service.registerClient(11, s1);
        service.registerClient(11, s2);

        const sockets = service.getSocketsByUser(11).map((s) => s.id).sort();
        expect(sockets).toEqual(['s1', 's2']);
    });

    test('removeSocket은 지정된 소켓만 제거하고 다른 소켓은 유지해야 한다', () => {
        const s1 = makeSocket('s1', 12);
        const s2 = makeSocket('s2', 12);
        service.registerClient(12, s1);
        service.registerClient(12, s2);

        // remove s1 by id
        service.removeSocket('s1');

        const sockets = service.getSocketsByUser(12).map((s) => s.id);
        expect(sockets).toHaveLength(1);
        expect(sockets[0]).toBe('s2');
    });

    test('removeSocket은 마지막 소켓을 제거하면 사용자 매핑을 삭제해야 한다', () => {
        const s1 = makeSocket('s1', 13);
        service.registerClient(13, s1);

        service.removeSocket('s1');

        const sockets = service.getSocketsByUser(13);
        expect(sockets).toHaveLength(0);
    });

    test('removeClient(userId, socketId)는 특정 소켓을 제거해야 한다', () => {
        const s1 = makeSocket('s1', 14);
        const s2 = makeSocket('s2', 14);
        service.registerClient(14, s1);
        service.registerClient(14, s2);

        service.removeClient(14, 's2');

        const sockets = service.getSocketsByUser(14).map((s) => s.id);
        expect(sockets).toEqual(['s1']);
    });

    test('removeClient(userId) (socketId 없이)는 해당 사용자의 모든 소켓을 제거해야 한다', () => {
        const s1 = makeSocket('s1', 15);
        const s2 = makeSocket('s2', 15);
        service.registerClient(15, s1);
        service.registerClient(15, s2);

        service.removeClient(15);

        const sockets = service.getSocketsByUser(15);
        expect(sockets).toHaveLength(0);
    });
});
