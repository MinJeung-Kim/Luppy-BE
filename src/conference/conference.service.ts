import { Injectable } from '@nestjs/common';
import { ConferenceDto } from './dto/conference.dto';
import { Socket } from 'socket.io';
import { QueryRunner, Repository } from 'typeorm';
import { WsException } from '@nestjs/websockets';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';

@Injectable()
export class ConferenceService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

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

  }
}
