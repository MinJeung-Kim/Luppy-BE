import { Module } from '@nestjs/common';
import { ChatGroupService } from './chat-group.service';
import { ChatGroupController } from './chat-group.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { User } from 'src/user/entity/user.entity';
import { Chat } from 'src/chat/entity/chat.entity';
import { ChatRoom } from 'src/chat/entity/chat-room.entity';
import { ChatGroup } from './entity/chat-group.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Chat, ChatRoom, ChatGroup]),
    CommonModule,
  ],
  controllers: [ChatGroupController],
  providers: [ChatGroupService],
})
export class ChatGroupModule { }
