import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class UpdateChatRoomDto {
    @IsNotEmpty()
    @IsNumber()
    id: number;

    @IsNotEmpty()
    @IsNumber()
    groupId: number;
}
