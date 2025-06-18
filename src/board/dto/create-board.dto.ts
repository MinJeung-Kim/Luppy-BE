import { IsNotEmpty } from 'class-validator';

export class CreateBoardDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  tags: string[];

  @IsNotEmpty()
  detail: string;

  @IsNotEmpty()
  userId: number;
  //   description: string;
  //   ownerId: number;
  //   isPublic: boolean;
}
