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
import { BaseGateway } from 'src/common/gateway/base.gateway';

@WebSocketGateway({
  cors: corsOptions,
  transports: ['websocket'],      // 폴링 비활성화 
  pingInterval: 25000,
  pingTimeout: 20000,
})
export class ChatGateway extends BaseGateway {

  constructor(
    private readonly chatService: ChatService,
    authService: AuthService,
    socketService: SocketService,
  ) {
    super(authService, socketService);
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
