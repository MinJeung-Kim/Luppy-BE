import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateChatDto {

    @IsNotEmpty()
    @IsNumber()
    chatRoomId: number;

    @IsNotEmpty()
    @IsNumber({}, { each: true })
    memberIds: number[];

    @IsNotEmpty()
    @IsString()
    msg: string;
}
