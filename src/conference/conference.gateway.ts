import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { ConferenceService } from './conference.service';
import { ConferenceDto } from './dto/conference.dto';
import { UseInterceptors } from '@nestjs/common';
import { WsTransactionInterceptor } from 'src/common/interceptor/ws-transaction.interceptor';
import { WsQueryRunner } from 'src/common/decorator/ws-query-runner.decorator';
import { Socket } from 'socket.io';
import { QueryRunner } from 'typeorm';
import { corsOptions } from 'src/utils/cors-options';
import { AuthService } from 'src/auth/auth.service';
import { SocketService } from 'src/common/service/socket.service';
import { BaseGateway } from 'src/common/gateway/base.gateway';

export type TJoinUser = {
  id: number;
  name: string;
  profile: string;
  isMicOn: boolean;
  isVideoOn: boolean;
}


interface ConnectedClient {
  userId: number;
  socket: string;
}

@WebSocketGateway({
  cors: corsOptions,
  transports: ['websocket'],      // 폴링 비활성화 
  pingInterval: 25000,
  pingTimeout: 20000,
})
export class ConferenceGateway extends BaseGateway {
  private readonly roomClients = new Map<number, ConnectedClient[]>();

  constructor(
    private readonly conferenceService: ConferenceService,
    authService: AuthService,
    socketService: SocketService,
  ) {
    super(authService, socketService);
  }

  /**
   * 클라이언트 연결 시 Conference 서비스에 등록
   */
  protected async onClientConnect(client: Socket, payload: any): Promise<void> {
    this.conferenceService.registerClient(payload.sub, client);
  }

  @SubscribeMessage('createConferenceRoom')
  @UseInterceptors(WsTransactionInterceptor)
  async handleConference(
    @MessageBody() body: ConferenceDto,
    @ConnectedSocket() client: Socket,
    @WsQueryRunner() qr: QueryRunner,
  ) {
    await this.conferenceService.createConferenceRoom(body, client, qr);
  }

  @SubscribeMessage('joinConferenceRoom')
  @UseInterceptors(WsTransactionInterceptor)
  async handleJoinConferenceRoom(
    @MessageBody() body: ConferenceDto,
    @ConnectedSocket() client: Socket,
    @WsQueryRunner() qr: QueryRunner,
  ) {
    await this.conferenceService.joinConferenceRoom(body, client, qr);
  }

  @SubscribeMessage('sendOffer')
  @UseInterceptors(WsTransactionInterceptor)
  async handleOffer(
    @MessageBody() { roomId, offer }: { roomId: string, offer: RTCSessionDescriptionInit },
    @ConnectedSocket() client: Socket,
  ) {
    this.conferenceService.offer({ roomId, offer }, client);
  }

  @SubscribeMessage('sendAnswer')
  @UseInterceptors(WsTransactionInterceptor)
  async handleAnswer(
    @MessageBody() { roomId, answer }: { roomId: string, answer: RTCSessionDescriptionInit },
    @ConnectedSocket() client: Socket,
  ) {
    this.conferenceService.answer({ roomId, answer }, client);
  }

  @SubscribeMessage('sendIceCandidate')
  @UseInterceptors(WsTransactionInterceptor)
  async handleIcecandidate(
    @MessageBody() { roomId, candidate }: { roomId: string, candidate: RTCIceCandidateInit },
    @ConnectedSocket() client: Socket,
  ) {
    this.conferenceService.icecandidate({ roomId, candidate }, client);
  }

  @SubscribeMessage('sendMediaState')
  @UseInterceptors(WsTransactionInterceptor)
  async handleMediaState(
    @MessageBody() { roomId, user }: { roomId: string, user: TJoinUser },
    @ConnectedSocket() client: Socket,
  ) {
    this.conferenceService.mediaState({ roomId, user }, client);
  }
}
