import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateChatDto {
  @IsString()
  message: string;

  @IsNumber()
  @IsOptional()
  room?: number;

  @IsString()
  host: string;

  @IsArray()
  @IsString({ each: true })
  guest: string[];
}
