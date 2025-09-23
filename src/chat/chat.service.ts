import { Socket } from 'socket.io';
import { Chat } from './entity/chat.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryRunner, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoom } from './entity/chat-room.entity';
import { ChatGroup } from 'src/chat-group/entity/chat-group.entity';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';
import { UpdateChatRoomDto } from './dto/update-chat-room.dto';
import { User } from 'src/user/entity/user.entity';

interface ConnectedClient {
    userId: number;
    socket: string;
}

@Injectable()
export class ChatService {

    // connectedClients : 다중 소켓 지원
    private readonly connectedClients = new Map<number, Set<string>>();
    private readonly socketMap = new Map<string, Socket>();
    private readonly roomClients = new Map<number, ConnectedClient[]>();

    constructor(
        @InjectRepository(Chat)
        private readonly chatRepository: Repository<Chat>,
        @InjectRepository(ChatRoom)
        private readonly chatRoomRepository: Repository<ChatRoom>,
    ) { }

    registerClient(userId: number, client: Socket) {
        const set = this.connectedClients.get(userId) ?? new Set<string>();
        set.add(client.id);
        this.connectedClients.set(userId, set);
        this.socketMap.set(client.id, client);
    }

    removeClient(userId: number, socketId?: string) {
        const set = this.connectedClients.get(userId);
        if (!set) return;

        if (socketId) {
            set.delete(socketId);
            this.socketMap.delete(socketId);

            if (set.size === 0) {
                this.connectedClients.delete(userId);
            } else {
                this.connectedClients.set(userId, set);
            }
            return;
        }

        // socketId가 없으면 해당 사용자의 모든 소켓을 제거
        for (const id of set) {
            this.socketMap.delete(id);
        }
        this.connectedClients.delete(userId);
    }

    removeSocket(socketId: string) {
        const client = this.socketMap.get(socketId);
        if (!client) return;

        for (const [userId, set] of this.connectedClients.entries()) {
            if (set.has(socketId)) {
                set.delete(socketId);
                if (set.size === 0) this.connectedClients.delete(userId);
                else this.connectedClients.set(userId, set);
                break;
            }
        }

        this.socketMap.delete(socketId);
    }

    getSocketsByUser(userId: number): Socket[] {
        const ids = this.connectedClients.get(userId) ?? new Set<string>();
        const sockets: Socket[] = [];
        for (const id of ids) {
            const s = this.socketMap.get(id);
            if (s) sockets.push(s);
        }
        return sockets;
    }


    async getChat(roomId: number) {
        const rows = await this.chatRepository
            .createQueryBuilder('chat')
            .leftJoin('chat.chatRoom', 'chatRoom')
            .leftJoin(User, 'sender', 'sender.id = chat.sender')
            .select([
                'chat.id',
                'chat.msg',
                'chat.createdAt',
                'chat.isRead',
            ])
            .addSelect('chatRoom.id', 'chatRoomId')
            .addSelect('sender.id', 'sender_id')
            .addSelect('sender.name', 'sender_name')
            .addSelect('sender.profile', 'sender_profile')
            .where('chatRoom.id = :roomId', { roomId })
            .orderBy('chat.createdAt', 'ASC')
            .getRawMany();

        return rows.map(r => ({
            id: r.chat_id,
            msg: r.chat_msg,
            createdAt: r.chat_createdAt,
            isRead: r.chat_isRead,
            chatRoomId: r.chatRoomId,
            sender: {
                id: r.sender_id,
                name: r.sender_name,
                profile: r.sender_profile,
            },
        }));
    }

    async createChatRoom(createChatRoomDto: CreateChatRoomDto, qr: QueryRunner) {

        const chatRoom = await qr.manager.create(ChatRoom,
            { memberIds: createChatRoomDto.memberIds.map(id => ({ id })) });

        return qr.manager.save(chatRoom);
    }

    async getChatRooms(userId: number, groupId: string) {
        const qb = this.chatRoomRepository
            .createQueryBuilder('chatRoom')
            // 내가 속한 방만 필터링 (필터용 alias: me)
            .innerJoin('chatRoom.memberIds', 'me', 'me.id = :userId', { userId })
            // 응답용으로 멤버 전체를 로드 (표시용 alias: members)
            .leftJoinAndSelect('chatRoom.memberIds', 'members')
            .leftJoinAndSelect('chatRoom.chatGroup', 'chatGroup')
            .select([
                'chatRoom',               // 채팅방 전체 컬럼
                'members.id',
                'members.name',
                'members.profile',
                'members.email',
                'members.phone',
                'chatGroup.id',
                'chatGroup.name',
            ])

            .distinct(true)             // 조인으로 인한 중복 방 제거
            .orderBy('chatRoom.updatedAt', 'DESC');

        if (groupId !== 'all-inbox') {
            qb.andWhere('chatRoom.chatGroup = :groupId', { groupId: Number(groupId) });
        }

        const rooms = await qb.getMany();

        // 필드를 memberIds -> members 로 변경
        return rooms.map(({ memberIds, ...rest }) => ({
            ...rest,
            members: memberIds,
        }));
    }

    async updateChatRoom(userId: number, updateChatRoomDto: UpdateChatRoomDto) {
        const id = Number(updateChatRoomDto.id);
        if (Number.isNaN(id)) {
            throw new Error('Invalid chat room id');
        }

        const chatRoom = await this.chatRoomRepository.findOne({
            where: { id },
            relations: ['memberIds']
        });

        if (!chatRoom) {
            throw new Error('Chat room not found');
        }

        if (updateChatRoomDto.groupId !== undefined) {
            chatRoom.chatGroup = { id: updateChatRoomDto.groupId } as ChatGroup;
        }

        return this.chatRoomRepository.save(chatRoom);
    }

    /* ================ Socket ================ */
    async joinChatRoom(roomId: number, client: Socket, qr: QueryRunner) {
        const userId = client.data.user.sub;
        const user = await qr.manager.findOne(User, { where: { id: userId } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // 채팅룸의 멤버 여부 확인
        const chatRoom = await qr.manager.findOne(ChatRoom, {
            where: { id: roomId },
            relations: ['memberIds'],
        });

        if (!chatRoom) {
            throw new NotFoundException('Chat room not found');
        }

        const isMember = chatRoom.memberIds?.some(m => m.id === userId);
        if (!isMember) {
            throw new NotFoundException('User is not a member of the chat room');
        }

        const clients = this.roomClients.get(roomId) ?? [];

        const existingIndex = clients.findIndex(c => c.socket === client.id || c.userId === userId);
        if (existingIndex !== -1) {
            clients[existingIndex] = { userId, socket: client.id };
        } else {
            clients.push({ userId, socket: client.id });
        }

        this.roomClients.set(roomId, clients);

        client.join(`chatRoom/${roomId}`);
        client.to(`chatRoom/${roomId}`).emit('userJoined', { userId });
    }

    async sendMessage(
        body: { roomId: number, msg: string },
        client: Socket,
        qr: QueryRunner,
    ) {
        const userId = client.data.user.sub;
        const user = await qr.manager.findOne(User, { where: { id: userId } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // 권한 검사: 사용자가 해당 채팅방의 멤버인지 확인
        const chatRoom = await qr.manager.findOne(ChatRoom, {
            where: { id: body.roomId },
            relations: ['memberIds'],
        });

        if (!chatRoom) {
            throw new NotFoundException('Chat room not found');
        }

        const isMember = chatRoom.memberIds?.some(m => m.id === userId);
        if (!isMember) {
            throw new NotFoundException('User is not a member of the chat room');
        }

        const chat = qr.manager.create(Chat, { ...body, chatRoom: { id: body.roomId }, sender: userId });
        await qr.manager.save(Chat, chat);

        const newChat = {
            id: chat.id,
            msg: chat.msg,
            createdAt: chat.createdAt,
            isRead: chat.isRead,
            chatRoomId: chat.chatRoom.id,
            sender: {
                id: userId,
                name: user.name,
                profile: user.profile,
            },
        };

        client.emit('sendMessage', newChat);
        client.to(`chatRoom/${body.roomId}`).emit('sendMessage', newChat);
    }
}
