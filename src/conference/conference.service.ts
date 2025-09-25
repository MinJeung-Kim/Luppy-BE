import { Injectable, NotFoundException } from '@nestjs/common';
import { ConferenceDto } from './dto/conference.dto';
import { Socket } from 'socket.io';
import { QueryRunner, Repository } from 'typeorm';
import { WsException } from '@nestjs/websockets';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { TJoinUser } from './conference.gateway';
import { SocketService } from 'src/common/service/socket.service';

@Injectable()
export class ConferenceService {
  private readonly connectedClients = new Map<string, Socket>();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly socketService: SocketService,
  ) { }


  async findHostAndGuests(body: ConferenceDto, qr: QueryRunner) {
    const { host, guests } = body;

    const hostUser = await qr.manager.findOne(User, {
      where: { id: host }
    });

    const guestUsers = await Promise.all(
      guests.map(guestId => qr.manager.findOne(User, { where: { id: guestId } })
      )
    );

    return { hostUser, guestUsers };
  }

  async createConferenceRoom(body: { roomId: string, guests: number[] }, client: Socket, qr: QueryRunner) {
    const userId = client.data.user.sub;
    const user = await qr.manager.findOne(User, { where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 게스트 정보를 데이터베이스에서 조회
    const guestUsers = await Promise.all(
      body.guests.map(guestId =>
        qr.manager.findOne(User, { where: { id: guestId } })
      )
    );

    // 존재하지 않는 게스트 필터링
    const validGuestUsers = guestUsers.filter(guest => guest !== null);

    this.connectedClients.set(body.roomId, client)

    client.join(body.roomId)
    client.emit('createConferenceRoom', { message: "회의실이 생성되었습니다." });

    // 호스트 정보
    const hostInfo = {
      id: user.id,
      name: user.name,
      profile: user.profile,
      isMicOn: true,
      isVideoOn: true
    };

    // 게스트들에게 초대 알림 보내기
    validGuestUsers.forEach(guest => {
      // SocketService를 사용해서 게스트의 소켓들을 찾기
      const guestSockets = this.socketService.getSocketsByUser(guest.id);

      console.log(`게스트 ${guest.name}에게 초대 알림 전송 중...`, guestSockets.length > 0 ? `${guestSockets.length}개 연결` : '연결 안됨');

      // 게스트의 모든 소켓에 초대 알림 전송
      guestSockets.forEach(guestSocket => {
        guestSocket.emit('conferenceInvitation', {
          host: hostInfo,
          roomId: body.roomId,
          message: `${user.name}님이 회의실에 초대했습니다.`
        });
      });
    });
  }

  async joinConferenceRoom(body: ConferenceDto, client: Socket, qr: QueryRunner) {
    const { host } = body;

    const hostUser = await qr.manager.findOne(User, {
      where: { id: host }
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