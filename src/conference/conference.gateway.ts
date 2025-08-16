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

@WebSocketGateway({
  cors: corsOptions,
  transports: ['websocket'],      // 폴링 비활성화 
  pingInterval: 25000,
  pingTimeout: 20000,
})
export class ConferenceGateway {
  constructor(
    private readonly conferenceService: ConferenceService,
    private readonly authService: AuthService,
  ) { }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // 클라이언트가 연결을 끊었을 때 실행되는 로직
    const user = client.data.user;
    if (user) {
      this.conferenceService.removeClient(user.sub);
    }
  }

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    // 클라이언트가 연결을 시도했을 때 실행되는 로직
    try {
      const rawToken = client.handshake.auth.token;
      if (!rawToken) {
        client.disconnect();
        return;
      }

      const payload = await this.authService.parseBearerToken(rawToken, false);

      if (payload) {
        client.data.user = payload;
        this.conferenceService.registerClient(payload.sub, client);
      } else {
        client.disconnect();
        return;
      }
    } catch (e) {
      console.log(e);

      client.disconnect();
    }
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
    @MessageBody() { roomId, cameraOn, micOn }: { roomId: string, cameraOn: boolean, micOn: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    this.conferenceService.mediaState({ roomId, cameraOn, micOn }, client);
  }
}
