import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { QueryRunner, Repository } from 'typeorm';
import { Socket } from 'socket.io';
import { Chat } from './entity/chat.entity';
import { ChatRoom } from './entity/chat-room.entity';
import { CreateChatDto } from './dto/create-chat.dto';
import { Role, User } from 'src/user/entity/user.entity';

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

  async createChatRoom(body: CreateChatDto, client: Socket, qr: QueryRunner) {
    const { host, guest } = body;
    console.log('host, guest : ', host, guest); // 디버깅용 로그

    // host와 guest를 User 엔티티로 변환
    const hostUser = await qr.manager.findOne(User, {
      where: { id: parseInt(host) }
    });

    const guestUsers = await Promise.all(
      guest.map(guestId =>
        qr.manager.findOne(User, { where: { id: parseInt(guestId) } })
      )
    );

    if (!hostUser) {
      throw new WsException('호스트 사용자를 찾을 수 없습니다.');
    }

    const validGuestUsers = guestUsers.filter(user => user !== null);
    if (validGuestUsers.length !== guest.length) {
      throw new WsException('일부 게스트 사용자를 찾을 수 없습니다.');
    }

    const chatRoom = await qr.manager.save(ChatRoom, {
      host: hostUser,
      hostId: hostUser.id,
      users: [hostUser, ...validGuestUsers],
    });

    // 필요한 사용자 정보만 선택해서 전송
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
    console.log('Chat room created:', hostInfo, guestInfos); // 디버깅용 로그


    return chatRoom;
  }

  async createMessage(
    payload: { sub: number },
    body: CreateChatDto,
    qr: QueryRunner,
  ) {
    const { room, message } = body;
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });


    if (!user) {
      throw new WsException('사용자를 찾을 수 없습니다.');
    }

    const chatRoom = await this.getOrCreateChatRoom(user, qr, room);

    if (!chatRoom) {
      throw new WsException('채팅방을 찾을 수 없습니다.');
    }

    const msgModal = await qr.manager.save(Chat, {
      author: user,
      message,
      chatRoom,
    });

    const client = this.connectedClients.get(user.id);
    client
      ?.to(`chatRoom/${chatRoom.id.toString()}`)
      .emit('sendMessage', plainToClass(Chat, msgModal));

    return message;
  }

  async getOrCreateChatRoom(user: User, qr: QueryRunner, room?: number) {
    if (user.role === Role.admin) {
      if (!room) {
        throw new WsException('어드민은 room 값을 필수로 제공해야합니다.');
      }

      return qr.manager.findOne(ChatRoom, {
        where: { id: room },
        relations: ['users'],
      });
    }

    let chatRoom = await qr.manager
      .createQueryBuilder(ChatRoom, 'chatRoom')
      .innerJoin('chatRoom.users', 'user')
      .where('user.id = :userId', { userId: user.id })
      .getOne();

    if (!chatRoom) {
      const adminUser = await qr.manager.findOne(User, {
        where: { role: Role.admin },
      });

      if (!adminUser) {
        throw new WsException('어드민 유저가 존재하지 않습니다.');
      }

      chatRoom = await this.chatRoomRepository.save({
        users: [user, adminUser],
      });

      [user.id, adminUser.id].forEach((userId) => {
        const client = this.connectedClients.get(userId);
        if (client) {
          client.emit('roomCreated', chatRoom?.id);
          client.join(`chatRoom/${chatRoom?.id}`);
        }
      });
    }

    return chatRoom;
  }

  /**
   * API to get the list of chat rooms
   */

  getChatList() {
    // roomId, host, guests, createdAt

    // 모든 방의 정보를 가져오고, 필요한 관계를 포함하여 반환
    // 여기서 'guests'는 방에 참여한 사용자들을 나타내며, 'host'는 방의 호스트를 나타냅니다.
    // 'createdAt'은 방이 생성된 시간을 나타냅니다.

    return this.chatRoomRepository.findAndCount({
      select: {
        id: true,
        createdAt: true,
        host: {
          id: true,
          name: true,
          email: true,
          profile: true,
        },
        users: {
          id: true,
          name: true,
          email: true,
          profile: true,
        }
      },
      relations: ['users', 'host'],
      order: { createdAt: 'DESC' },
    });
  }
}