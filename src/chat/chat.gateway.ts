import { Socket } from 'socket.io';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { AuthService } from 'src/auth/auth.service';
import { corsOptions } from 'src/utils/cors-options';
import { ChatService } from './chat.service';
import { UseInterceptors } from '@nestjs/common';
import { WsTransactionInterceptor } from 'src/common/interceptor/ws-transaction.interceptor';
import { WsQueryRunner } from 'src/common/decorator/ws-query-runner.decorator';
import { QueryRunner } from 'typeorm';
import { SocketService } from 'src/common/service/socket.service';

@WebSocketGateway({
  cors: corsOptions,
  transports: ['websocket'],      // 폴링 비활성화 
  pingInterval: 25000,
  pingTimeout: 20000,
})
export class ChatGateway {

  constructor(
    private readonly chatService: ChatService,
    private readonly authService: AuthService,
    private readonly socketService: SocketService,
  ) { }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // 클라이언트가 연결을 끊었을 때 실행되는 로직
    const user = client.data.user;
    if (user) {
      // remove only this socket
      this.socketService.removeSocket(client.id);
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
        this.socketService.registerClient(payload.sub, client);

      } else {
        client.disconnect();
        return;
      }
    } catch (e) {
      console.log(e);

      client.disconnect();
    }
  }

  @SubscribeMessage('joinChatRoom')
  @UseInterceptors(WsTransactionInterceptor)
  async handleJoinChatRoom(
    @MessageBody() roomId: number,
    @ConnectedSocket() client: Socket,
    @WsQueryRunner() qr: QueryRunner,
  ) {
    await this.chatService.joinChatRoom(roomId, client, qr);
  }


  @SubscribeMessage('sendMessage')
  @UseInterceptors(WsTransactionInterceptor)
  async handleSendMessage(
    @MessageBody() body: { roomId: number, msg: string },
    @ConnectedSocket() client: Socket,
    @WsQueryRunner() qr: QueryRunner,
  ) {
    await this.chatService.sendMessage(body, client, qr);
  }

}
