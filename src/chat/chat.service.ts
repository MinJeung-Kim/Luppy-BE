import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { QueryRunner, Repository } from 'typeorm';
import { Socket } from 'socket.io';
import { Chat } from './entity/chat.entity';
import { ChatRoom } from './entity/chat-room.entity';
import { CreateChatDto } from './dto/create-chat.dto';
import { User } from 'src/user/entity/user.entity';

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


    return message;
  }


  /**
   * ========== API to get the list of chat rooms ==========
   */

  getChatList(userId: number) {
    // userId가 호스트이거나 게스트로 속해있는 채팅방만 필터링하여 반환
    // 'users' 관계를 통해 해당 사용자가 포함된 방을 찾습니다.

    return this.chatRoomRepository
      .createQueryBuilder('chatRoom')
      .leftJoinAndSelect('chatRoom.host', 'host')
      .leftJoinAndSelect('chatRoom.users', 'users')
      .innerJoin('chatRoom.users', 'filterUser', 'filterUser.id = :userId', { userId })
      .select([
        'chatRoom.id',
        'chatRoom.createdAt',
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
      .orderBy('chatRoom.createdAt', 'DESC')
      .getManyAndCount();
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

}