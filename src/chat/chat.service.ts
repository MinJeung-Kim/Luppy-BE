import { Injectable, NotFoundException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { QueryRunner, Repository } from 'typeorm';
import { Socket } from 'socket.io';
import { Chat } from './entity/chat.entity';
import { ChatRoom } from './entity/chat-room.entity';
import { CreateChatDto } from './dto/create-chat.dto';
import { User } from 'src/user/entity/user.entity';
import { CreateGroupDto } from './dto/create-chat-group';
import { ChatGroup } from './entity/chat-group.entity';
import { UpdateGroupDto } from './dto/update-chat-group';

@Injectable()
export class ChatService {
  private readonly connectedClients = new Map<number, Socket>();

  constructor(
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ChatGroup)
    private readonly chatGroupRepository: Repository<ChatGroup>,
  ) { }

  registerClient(userId: number, client: Socket) {
    this.connectedClients.set(userId, client);
  }

  removeClient(userId: number) {
    this.connectedClients.delete(userId);
  }

  async joinUserRooms(user: { sub: number }, client: Socket) {
    const chatRooms = await this.chatRoomRepository
      .createQueryBuilder('chatRoom')
      .innerJoin('chatRoom.users', 'user', 'user.id = :userId', {
        userId: user.sub,
      })
      .getMany();

    chatRooms.forEach((room) => {
      client.join(`chatRoom/${room.id.toString()}`);
    });
  }

  async findHostAndGuests(body: CreateChatDto, qr: QueryRunner) {
    const { host, guests } = body;

    const hostUser = await qr.manager.findOne(User, {
      where: { id: parseInt(host) }
    });

    const guestUsers = await Promise.all(
      guests.map(guestId => qr.manager.findOne(User, { where: { id: guestId } })
      )
    );

    return { hostUser, guestUsers };
  }

  async createChatRoom(body: CreateChatDto, client: Socket, qr: QueryRunner) {
    const { hostUser, guestUsers } = await this.findHostAndGuests(body, qr);

    if (!hostUser) {
      throw new WsException('호스트 사용자를 찾을 수 없습니다.');
    }

    const validGuestUsers = guestUsers.filter(user => user !== null);
    if (validGuestUsers.length !== body.guests.length) {
      throw new WsException('일부 게스트 사용자를 찾을 수 없습니다.');
    }

    const chatRoom = await qr.manager.save(ChatRoom, {
      host: hostUser,
      hostId: hostUser.id,
      users: [hostUser, ...validGuestUsers],
    });

    const hostInfo = {
      id: hostUser.id,
      email: hostUser.email,
      name: hostUser.name,
      profile: hostUser.profile,
      role: hostUser.role,
      phone: hostUser.phone
    };

    const guestInfos = validGuestUsers.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      profile: user.profile,
      role: user.role,
      phone: user.phone
    }));

    client.emit('roomCreated', { host: hostInfo, guests: guestInfos });

    return chatRoom;
  }

  async createMessage(
    body: CreateChatDto,
    client: Socket,
    qr: QueryRunner,
  ) {
    const { roomId, message } = body;
    const payload = client.data.user;
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });


    if (!user) {
      throw new WsException('사용자를 찾을 수 없습니다.');
    }

    const chatRoom = await qr.manager.findOne(ChatRoom, {
      where: { id: roomId },
      relations: ['users'],
    });


    if (!chatRoom) {
      throw new WsException('채팅방을 찾을 수 없습니다.');
    }

    const msgModal = await qr.manager.save(Chat, {
      author: { id: user.id, email: user.email, name: user.name, profile: user.profile },
      message,
      chatRoom: {
        id: chatRoom.id,
        hostId: chatRoom.hostId,
        createdAt: chatRoom.createdAt,
      },
    });

    // const client = this.connectedClients.get(user.id);
    // client
    //   ?.to(`chatRoom/${chatRoom.id.toString()}`)
    //   .emit('sendMessage', plainToClass(Chat, msgModal));
    client?.emit('sendMessage', plainToClass(Chat, msgModal)); // 본인에게도 전송

    console.log(`Message sent in room ${chatRoom.id}:`, msgModal); // 디버깅용 로그

    // 저장된 메시지 전체를 반환하여 클라이언트/호출자에게 id, createdAt 등 메타 정보를 제공
    return plainToClass(Chat, msgModal);
  }


  /**
   * ========== API to get the list of chat rooms ==========
   */

  async getChatList(userId: number, groupId: string) {
    // todo : 채팅방 마지막 메시지 포함 👈
    const queryBuilder = this.chatRoomRepository
      .createQueryBuilder('chatRoom')
      .leftJoinAndSelect('chatRoom.host', 'host')
      .leftJoinAndSelect('chatRoom.users', 'users')
      .leftJoinAndSelect('chatRoom.chatGroup', 'chatGroup')
      .innerJoin('chatRoom.users', 'filterUser', 'filterUser.id = :userId', { userId })
      .select([
        'chatRoom.id',
        'chatRoom.chatGroup',
        'chatRoom.createdAt',
        'chatGroup.id',
        'chatGroup.name',
        'host.id',
        'host.name',
        'host.phone',
        'host.email',
        'host.profile',
        'users.id',
        'users.name',
        'users.phone',
        'users.email',
        'users.profile'
      ])
      .addSelect(subQuery => {
        return subQuery
          .select('c.message')
          .from(Chat, 'c')
          .where('c.chatRoomId = chatRoom.id')
          .orderBy('c.createdAt', 'DESC')
          .limit(1);
      }, 'lastMessage')
      .orderBy('chatRoom.createdAt', 'DESC');

    if (groupId === 'all-inbox') {
      // 모든 값 리턴 
      const { entities, raw } = await queryBuilder.getRawAndEntities();
      const result = entities.map((room, idx) => ({
        ...room,
        lastMessage: raw[idx].lastMessage,
      }));
      return [result, entities.length];
    } else {
      // groupId가 null이 아닌 값 중에서 일치하는 것만 리턴
      return await queryBuilder
        .andWhere('chatRoom.chatGroupId IS NOT NULL')
        .andWhere('chatRoom.chatGroupId = :groupId', { groupId })
        .getManyAndCount();
    }

  }

  getChatRoom(chatRoomId: string) {
    // roomId에 해당하는 채팅 내용을 가져옵니다.
    return this.chatRepository
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.chatRoom', 'chatRoom')
      .leftJoinAndSelect('chat.author', 'author')
      .where('chatRoom.id = :chatRoomId', { chatRoomId })
      .orderBy('chat.createdAt', 'ASC')
      .getMany();
  }

  createGroupChat(createGroupDto: CreateGroupDto, userId: number, qr: QueryRunner) {
    // creator 관계에 현재 사용자 연결 (추가 조회 없이 FK만 설정)
    const chatGroup = qr.manager.create(ChatGroup, {
      ...createGroupDto,
      creator: { id: userId } as User,
    });
    return qr.manager.save(chatGroup);
  }

  async getGroupList(userId: number) {
    const groupList = this.chatGroupRepository.find({
      where: { creator: { id: userId } },
      relations: {
        chatRooms: {
          users: true,
          host: true,
        },
      },
      order: { createdAt: 'DESC' },
    });

    return groupList;
  }

  async moveChatToGroup(id: number, updateGroupDto: UpdateGroupDto, qr: QueryRunner) {
    const chatRoom = await qr.manager.findOne(ChatRoom, {
      where: { id },
      relations: {
        chatGroup: true,
        users: true,
      },
    });


    if (!chatRoom) {
      throw new NotFoundException('채팅방을 찾을 수 없습니다.');
    }

    const { groupId } = updateGroupDto;

    if (groupId) {
      const chatGroup = await qr.manager.findOne(ChatGroup, { where: { id: groupId } });
      if (!chatGroup) {
        throw new NotFoundException('채팅 그룹을 찾을 수 없습니다.');
      }

      chatRoom.chatGroup = chatGroup;
    }

    await qr.manager.save(chatRoom);

    return this.chatRoomRepository.findOne({ where: { id } });
  }
}