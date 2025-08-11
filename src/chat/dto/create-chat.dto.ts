import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateChatDto {
  @IsString()
  message: string;

  @IsNumber()
  @IsOptional()
  roomId?: number;

  @IsString()
  host: string;

  @IsArray()
  @IsNumber({}, { each: true })
  guests: number[];
}