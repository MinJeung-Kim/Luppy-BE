import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { CanvasService } from './canvas.service';
import { SuggestDto } from './dto/suggest.dto';
import { corsOptions } from 'src/utils/cors-options';
import { BaseGateway } from 'src/common/gateway/base.gateway';
import { AuthService } from 'src/auth/auth.service';
import { SocketService } from 'src/common/service/socket.service';
import { UseInterceptors } from '@nestjs/common';
import { WsTransactionInterceptor } from 'src/common/interceptor/ws-transaction.interceptor';
import { Socket } from 'socket.io';

@WebSocketGateway({
  cors: corsOptions,
  transports: ['websocket'],      // 폴링 비활성화 
  pingInterval: 25000,
  pingTimeout: 20000,
})
export class CanvasGateway extends BaseGateway {
  constructor(
    private readonly canvasService: CanvasService,
    authService: AuthService,
    socketService: SocketService,
  ) {
    super(authService, socketService);
  }

  @SubscribeMessage('suggest')
  @UseInterceptors(WsTransactionInterceptor)
  async onSuggest(
    @MessageBody() suggestDto: SuggestDto,
    @ConnectedSocket() client: Socket,
  ) {
    return this.canvasService.analyze(suggestDto, client);
  }
}
