/// <reference types="jest" />
import { ChatService } from './chat.service';
import { NotFoundException } from '@nestjs/common';

describe('ChatService - join 권한 검사', () => {
    let service: ChatService;

    beforeEach(() => {
        // @ts-expect-error minimal constructor mocking
        service = new ChatService(undefined, undefined);
    });

    function makeSocket(id: string, userId: number) {
        const socket: any = {
            id,
            data: { user: { sub: userId } },
            join: jest.fn(),
            emit: jest.fn(),
            to: jest.fn(() => ({ emit: jest.fn() })),
        };
        return socket as any;
    }

    test('사용자가 채팅룸 멤버가 아니면 joinChatRoom은 예외를 던진다', async () => {
        const socket = makeSocket('s-join-1', 100);

        const qr: any = {
            manager: {
                findOne: jest.fn((entity: any, opts: any) => {
                    if (entity && entity.name === 'User') {
                        return Promise.resolve({ id: 100, name: 'u100' });
                    }
                    // ChatRoom 조회
                    return Promise.resolve({ id: 1, memberIds: [{ id: 200 }] });
                }),
            },
        };

        await expect(service.joinChatRoom(1, socket, qr)).rejects.toThrow(NotFoundException);
    });

    test('멤버인 경우는 정상적으로 join 처리', async () => {
        const socket = makeSocket('s-join-2', 201);

        const qr: any = {
            manager: {
                findOne: jest.fn((entity: any, opts: any) => {
                    if (entity && entity.name === 'User') {
                        return Promise.resolve({ id: 201, name: 'u201' });
                    }
                    return Promise.resolve({ id: 2, memberIds: [{ id: 201 }] });
                }),
            },
        };

        await service.joinChatRoom(2, socket, qr);

        // socket.join과 emit이 호출되었는지 확인
        expect(socket.join).toHaveBeenCalledWith('chatRoom/2');
    });
});
