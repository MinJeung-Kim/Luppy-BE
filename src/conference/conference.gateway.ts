import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { ConferenceService } from './conference.service';
import { ConferenceDto } from './dto/conference.dto';
import { UseInterceptors } from '@nestjs/common';
import { WsTransactionInterceptor } from 'src/common/interceptor/ws-transaction.interceptor';
import { WsQueryRunner } from 'src/common/decorator/ws-query-runner.decorator';
import { Socket } from 'socket.io';
import { QueryRunner } from 'typeorm';

@WebSocketGateway()
export class ConferenceGateway {
  constructor(private readonly conferenceService: ConferenceService) { }



  @SubscribeMessage('createConferenceRoom')
  @UseInterceptors(WsTransactionInterceptor)
  async handleConference(
    @MessageBody() body: ConferenceDto,
    @ConnectedSocket() client: Socket,
    @WsQueryRunner() qr: QueryRunner,
  ) {
    await this.conferenceService.createConferenceRoom(body, client, qr);
  }
}
