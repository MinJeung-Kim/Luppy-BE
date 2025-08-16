import { Injectable } from '@nestjs/common';
import { ConferenceDto } from './dto/conference.dto';
import { Socket } from 'socket.io';
import { QueryRunner, Repository } from 'typeorm';
import { WsException } from '@nestjs/websockets';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { TJoinUser } from './conference.gateway';

@Injectable()
export class ConferenceService {
  private readonly connectedClients = new Map<number, Socket>();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }


  registerClient(userId: number, client: Socket) {
    this.connectedClients.set(userId, client);
  }

  removeClient(userId: number) {
    this.connectedClients.delete(userId);
  }


  async findHostAndGuests(body: ConferenceDto, qr: QueryRunner) {
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

  async createConferenceRoom(body: ConferenceDto, client: Socket, qr: QueryRunner) {
    const { hostUser, guestUsers } = await this.findHostAndGuests(body, qr);

    if (!hostUser) {
      throw new WsException('호스트 사용자를 찾을 수 없습니다.');
    }

    const validGuestUsers = guestUsers.filter(user => user !== null);
    if (validGuestUsers.length !== body.guests.length) {
      throw new WsException('일부 게스트 사용자를 찾을 수 없습니다.');
    }

    client.join(body.roomId)
    client.emit('createConferenceRoom', { message: "회의실이 생성되었습니다." });

    // 게스트들에게 초대 알림 보내기
    validGuestUsers.forEach(guest => {
      const guestClient = this.connectedClients.get(guest.id);
      const guestInfo = {
        id: guest.id,
        name: guest.name,
        profile: guest.profile,
        isMicOn: true,
        isVideoOn: true
      }
      if (guestClient) {
        guestClient.emit('conferenceInvitation', {
          host: guestInfo, roomId: body.roomId

        });
      }
    });
  }

  async joinConferenceRoom(body: ConferenceDto, client: Socket, qr: QueryRunner) {
    const { host } = body;

    const hostUser = await qr.manager.findOne(User, {
      where: { id: parseInt(host) }
    });

    if (!hostUser) {
      throw new WsException('호스트 사용자를 찾을 수 없습니다.');
    }
    const joinUser = {
      id: hostUser.id,
      name: hostUser.name,
      email: hostUser.email,
      phone: hostUser.phone,
      profile: hostUser.profile
    }

    // 클라이언트를 방에 참가시킴
    client.join(body.roomId);

    // 참가 성공 알림을 해당 클라이언트에게 전송
    client.emit('joinConferenceRoom', {
      message: "회의실에 참가했습니다.",
      roomId: body.roomId
    });

    // 방에 있는 다른 참가자들에게 새로운 참가자 알림
    client.to(body.roomId).emit('userJoined', {
      message: "새로운 참가자가 회의실에 입장했습니다.",
      joinUser
    });
  }


  offer({ roomId, offer }: { roomId: string, offer: RTCSessionDescriptionInit }, client: Socket) {
    client.to(roomId).emit('offer', { offer });
  }

  answer({ roomId, answer }: { roomId: string, answer: RTCSessionDescriptionInit }, client: Socket) {
    client.to(roomId).emit('answer', { answer });
  }

  icecandidate({ roomId, candidate }: { roomId: string, candidate: RTCIceCandidateInit }, client: Socket) {
    client.to(roomId).emit('icecandidate', { candidate });
  }

  mediaState({ roomId, user }: { roomId: string, user: TJoinUser }, client: Socket) {
    client.to(roomId).emit('mediaState', user);
  }
}