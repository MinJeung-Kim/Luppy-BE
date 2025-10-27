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
    private readonly roomClients = new Map<number, ConnectedClient[]>();

    constructor(
        @InjectRepository(Chat)
        private readonly chatRepository: Repository<Chat>,
        @InjectRepository(ChatRoom)
        private readonly chatRoomRepository: Repository<ChatRoom>,
    ) { }

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

    async getChatRooms(userId: number, groupId: string, page: number, limit: number) {
        const qb = this.chatRoomRepository
            .createQueryBuilder('chatRoom')
            // 내가 속한 방만 필터링 (필터용 alias: me)
            .innerJoin('chatRoom.memberIds', 'me', 'me.id = :userId', { userId })
            // 응답용으로 멤버 전체를 로드 (표시용 alias: members)
            .leftJoinAndSelect('chatRoom.memberIds', 'members')
            .leftJoinAndSelect('chatRoom.chatGroup', 'chatGroup')
            // 마지막 메시지 조인 추가
            .leftJoin(
                qb => qb
                    .select([
                        'chat.id as id',
                        'chat.msg as msg',
                        'chat.createdAt as createdAt',
                        'chat.chatRoomId as chatRoomId',
                        'chat.sender as sender'
                    ])
                    .from(Chat, 'chat')
                    .where('chat.id IN ' +
                        qb.subQuery()
                            .select('MAX(subChat.id)')
                            .from(Chat, 'subChat')
                            .groupBy('subChat.chatRoomId')
                            .getQuery()
                    ),
                'lastChat',
                'lastChat.chatRoomId = chatRoom.id',
            )
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
            .addSelect('lastChat.msg', 'lastChatMsg')
            .addSelect('lastChat.createdAt', 'lastChatCreatedAt')
            .distinct(true)             // 조인으로 인한 중복 방 제거
            .orderBy('chatRoom.updatedAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);


        if (groupId !== 'all-inbox') {
            qb.andWhere('chatRoom.chatGroup = :groupId', { groupId: Number(groupId) });
        }

        // ✅ alias 컬럼을 받기 위해 raw+entities 동시 획득
        const { raw, entities } = await qb.getRawAndEntities();

        // Raw 데이터를 채팅룸 ID 기준으로 맵핑
        const rawByRoomId = new Map();
        raw.forEach(r => {
            rawByRoomId.set(r.chatRoom_id, r);
        });

        const chatList = entities.map((room) => {
            const { memberIds, ...rest } = room;
            const rawData = rawByRoomId.get(room.id);
            const result = {
                ...rest,
                members: memberIds,
                lastChatMsg: rawData?.lastChatMsg ?? '대화를 시작해 보세요.',
                lastChatCreatedAt: rawData?.lastChatCreatedAt ?? null,
            };
            return result;
        });
        return {
            chatList,
            totalPages: Math.ceil(await qb.getCount() / limit)
        };
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
                email: user.email,
                profile: user.profile,
            },
        };

        client.emit('sendMessage', newChat);
        client.to(`chatRoom/${body.roomId}`).emit('sendMessage', newChat);
    }
}
