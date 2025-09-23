import { Injectable } from '@nestjs/common';
import { CreateChatGroupDto } from './dto/create-chat-group.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatGroup } from './entity/chat-group.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ChatGroupService {
  constructor(
    @InjectRepository(ChatGroup)
    private readonly chatGroupRepository: Repository<ChatGroup>,
  ) { }

  create(createChatGroupDto: CreateChatGroupDto, userId: number) {
    const chatGroup = this.chatGroupRepository.create({ ...createChatGroupDto, user: { id: userId } });
    return this.chatGroupRepository.save(chatGroup);
  }

  findAll(userId: number) {
    return this.chatGroupRepository.find({ where: { user: { id: userId } } });
  }
}
