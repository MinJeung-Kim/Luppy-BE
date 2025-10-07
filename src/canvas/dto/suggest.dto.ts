import { IsString, IsIn, IsOptional, IsArray } from 'class-validator';

export class SuggestDto {
    @IsString()
    @IsIn(['rectangle', 'rounded', 'circle', 'arrow', 'other'])
    shape!: 'rectangle' | 'rounded' | 'circle' | 'arrow' | 'other';

    @IsString()
    @IsOptional()
    context?: string;

    @IsArray()
    @IsOptional()
    coords?: Array<{ x: number; y: number }>;

    @IsString()
    @IsOptional()
    color?: string;
}
