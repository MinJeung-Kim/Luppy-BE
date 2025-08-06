import { ClassSerializerInterceptor, Controller, Get, UseInterceptors, Request, UnauthorizedException, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { RequestWithUser } from 'src/types/request';

@Controller('chat')
@UseInterceptors(ClassSerializerInterceptor)
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Get('list')
    getChatList(@Request() req: RequestWithUser) {
        if (!req.user?.sub) {
            throw new UnauthorizedException('인증이 필요합니다.');
        }

        const userId = req.user.sub;
        return this.chatService.getChatList(userId);
    }

    @Get('room/:id')
    getChatRoom(@Param() req: { id: string }) {
        const roomId = req.id;
        return this.chatService.getChatRoom(roomId);
    }
}