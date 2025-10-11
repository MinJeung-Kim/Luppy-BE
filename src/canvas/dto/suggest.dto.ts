import { IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { HintDto } from './hint.dto';

export class SuggestDto {
    @IsNotEmpty()
    file: Express.Multer.File;

    @ValidateNested()
    @Type(() => HintDto)
    hint: HintDto;
}