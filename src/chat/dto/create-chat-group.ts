import { IsOptional, IsString } from 'class-validator';

export class CreateGroupDto {
    @IsString()
    emoji: string;

    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description: string;

}