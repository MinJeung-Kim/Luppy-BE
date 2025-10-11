import { IsNumber } from 'class-validator';

export class BboxDto {
    @IsNumber()
    left: number;

    @IsNumber()
    top: number;

    @IsNumber()
    width: number;

    @IsNumber()
    height: number;
}