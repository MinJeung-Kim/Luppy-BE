import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateBoardDto {
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsNotEmpty()
  @IsOptional()
  tags?: string[];

  @IsNotEmpty()
  @IsOptional()
  detail?: string;

  @IsNotEmpty()
  @IsOptional()
  userId?: number;
  // description?: string;
  // ownerId?: number;
  // isPublic?: boolean;
}
