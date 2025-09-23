import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateChatGroupDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    emoji: string;

    @IsOptional()
    @IsString()
    desc?: string;

}
