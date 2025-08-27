import { ClassSerializerInterceptor, Controller, Get, UseInterceptors, Request, UnauthorizedException, Param, Post, Body, Patch, ParseIntPipe, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { RequestWithUser } from 'src/types/request';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { CreateGroupDto } from './dto/create-chat-group';

@Controller('chat')
@UseInterceptors(ClassSerializerInterceptor)
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Get('list')
    getChatList(@Request() req: RequestWithUser, @Query('groupId') groupId: string) {
        if (!req.user?.sub) {
            throw new UnauthorizedException('인증이 필요합니다.');
        }

        const userId = req.user.sub;
        return this.chatService.getChatList(userId, groupId);
    }

    @Get('room/:id')
    getChatRoom(@Param() req: { id: string }) {
        const roomId = req.id;
        return this.chatService.getChatRoom(roomId);
    }

    @Post('group')
    @UseInterceptors(TransactionInterceptor)
    createGroupChat(@Body() body: CreateGroupDto, @Request() req: RequestWithUser & { queryRunner: any }) {
        if (!req.user?.sub) {
            throw new UnauthorizedException('인증이 필요합니다.');
        }
        return this.chatService.createGroupChat(body, req.user.sub, req.queryRunner);
    }


    @Get('group')
    @UseInterceptors(TransactionInterceptor)
    getGroupList(@Request() req: RequestWithUser) {
        if (!req.user?.sub) {
            throw new UnauthorizedException('인증이 필요합니다.');
        }

        const userId = req.user.sub;
        return this.chatService.getGroupList(userId);
    }


    @Patch('group/:id')
    @UseInterceptors(TransactionInterceptor)
    moveChatToGroup(@Param('id', ParseIntPipe) id: number,
        @Body() groupId: number,
        @Request() res,) {

        return this.chatService.moveChatToGroup(id, groupId, res.queryRunner);
    }
}