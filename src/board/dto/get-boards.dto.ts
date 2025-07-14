import { IsString, IsOptional } from 'class-validator';
import { CursorPaginationDto } from 'src/common/dto/cursor-pagination.dto';
import { PagePaginationDto } from 'src/common/dto/page-pagination.dto';

// export class GetBoardsDto extends PagePaginationDto {
export class GetBoardsDto extends CursorPaginationDto {
  @IsString()
  @IsOptional()
  title?: string;
}
