import { Controller, Post, Body, UseInterceptors, Request, Get, Query, Patch, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { assertAuthenticated } from 'src/common/utils/auth.util';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';
import { RequestWithUser } from 'src/types/request';
import { UpdateChatRoomDto } from './dto/update-chat-room.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) { }


  @Get()
  @UseInterceptors(TransactionInterceptor)
  getChat(
    @Query('id') roomId: number,
    @Request() req: RequestWithUser
  ) {
    return this.chatService.getChat(roomId);
  }

  @Post('room')
  @UseInterceptors(TransactionInterceptor)
  createGroupChat(
    @Body() createChatRoomDto: CreateChatRoomDto,
    @Request() req
  ) {
    return this.chatService.createChatRoom(createChatRoomDto, req.queryRunner);
  }

  @Get('room')
  @UseInterceptors(TransactionInterceptor)
  getChatRooms(
    @Query('id') groupId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Request() req: RequestWithUser
  ) {
    const userId = assertAuthenticated(req);
    return this.chatService.getChatRooms(userId, groupId, page, limit);
  }

  @Patch('room')
  @UseInterceptors(TransactionInterceptor)
  updateChatRoom(
    @Body() updateChatRoomDto: UpdateChatRoomDto,
    @Request() req: RequestWithUser
  ) {
    const userId = assertAuthenticated(req);
    return this.chatService.updateChatRoom(userId, updateChatRoomDto);
  }


}
