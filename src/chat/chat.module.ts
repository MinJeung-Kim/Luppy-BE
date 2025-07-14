import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { ChatRoom } from './entity/chat-room.entity';
import { Chat } from './entity/chat.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, ChatRoom, Chat]), AuthModule],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
