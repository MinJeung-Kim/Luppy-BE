import { ClassSerializerInterceptor, Controller, Get, UseInterceptors } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
@UseInterceptors(ClassSerializerInterceptor)
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Get('list')
    getChatList() {
        return this.chatService.getChatList();
    }
}