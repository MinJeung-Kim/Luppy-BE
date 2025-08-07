import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { QueryRunner } from 'typeorm';
import { ChatService } from './chat.service';
import { AuthService } from 'src/auth/auth.service';
import { UseInterceptors } from '@nestjs/common';
import { WsTransactionInterceptor } from 'src/common/interceptor/ws-transaction.interceptor';
import { WsQueryRunner } from 'src/common/decorator/ws-query-runner.decorator';
import { CreateChatDto } from './dto/create-chat.dto';
import { corsOptions } from 'src/utils/cors-options';

@WebSocketGateway({
  cors: corsOptions,
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly chatService: ChatService,
    private readonly authService: AuthService,
  ) { }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // 클라이언트가 연결을 끊었을 때 실행되는 로직
    const user = client.data.user;
    if (user) {
      this.chatService.removeClient(user.sub);
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
        this.chatService.registerClient(payload.sub, client);
        await this.chatService.joinUserRooms(payload, client);
      } else {
        client.disconnect();
        return;
      }
    } catch (e) {
      console.log(e);

      client.disconnect();
    }
  }

  @SubscribeMessage('createChatRoom')
  @UseInterceptors(WsTransactionInterceptor)
  async handleCreateChatRoom(
    @MessageBody() body: CreateChatDto,
    @ConnectedSocket() client: Socket,
    @WsQueryRunner() qr: QueryRunner,
  ) {
    await this.chatService.createChatRoom(body, client, qr);
  }

  @SubscribeMessage('sendMessage')
  @UseInterceptors(WsTransactionInterceptor)
  async handleMessage(
    @MessageBody() body: CreateChatDto,
    @ConnectedSocket() client: Socket,
    @WsQueryRunner() qr: QueryRunner,
  ) {
    const payload = client.data.user;
    await this.chatService.createMessage(payload, body, qr);
  }
}
