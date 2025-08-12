import { IsArray, IsNumber, IsString } from 'class-validator';

export class ConferenceDto {

    @IsString()
    roomId: string;

    @IsString()
    host: string;

    @IsArray()
    @IsNumber({}, { each: true })
    guests: number[];
}
