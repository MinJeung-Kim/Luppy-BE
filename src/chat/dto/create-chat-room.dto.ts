import { IsNotEmpty, IsNumber } from 'class-validator';


export class CreateChatRoomDto {
    @IsNotEmpty()
    @IsNumber({}, { each: true })
    memberIds: number[];
}
