import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { SocketService } from './service/socket.service';

@Module({
  imports: [],
  controllers: [],
  providers: [CommonService, SocketService],
  exports: [CommonService, SocketService],
})
export class CommonModule { }
