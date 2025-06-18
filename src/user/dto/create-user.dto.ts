import { IsDateString, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsDateString()
  dob: Date;

  @IsNotEmpty()
  nationality: string;
}
