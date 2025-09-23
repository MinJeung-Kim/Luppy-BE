import { Controller, Get, Post, Body, UseInterceptors, Request } from '@nestjs/common';
import { ChatGroupService } from './chat-group.service';
import { CreateChatGroupDto } from './dto/create-chat-group.dto';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { assertAuthenticated } from 'src/common/utils/auth.util';
import { RequestWithUser } from 'src/types/request';

@Controller('chat-group')
export class ChatGroupController {
  constructor(private readonly chatGroupService: ChatGroupService) { }

  @Post()
  @UseInterceptors(TransactionInterceptor)
  create(@Body() createChatGroupDto: CreateChatGroupDto,
    @Request() req) {
    const userId = assertAuthenticated(req);
    return this.chatGroupService.create(createChatGroupDto, userId);
  }

  @Get()
  findAll(
    @Request() req: RequestWithUser) {
    const userId = assertAuthenticated(req);
    return this.chatGroupService.findAll(userId);
  }

}
