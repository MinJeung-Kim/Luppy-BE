import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { BboxDto } from './bbox.dto';
import { Type } from 'class-transformer';

export class HintDto {
    @IsString()
    @IsNotEmpty()
    stroke: string;

    @ValidateNested()
    @Type(() => BboxDto)
    bbox: BboxDto;
}