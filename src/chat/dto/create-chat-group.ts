import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateGroupDto {
    @IsNumber()
    groupId: number;

    @IsString()
    emoji: string;

    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description: string;

}