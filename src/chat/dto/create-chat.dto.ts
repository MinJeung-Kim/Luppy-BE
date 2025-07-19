import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateChatDto {
  @IsString()
  message: string;

  @IsNumber()
  @IsOptional()
  room?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  userIds?: string[];
}
