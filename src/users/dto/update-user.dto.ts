import { IsOptional, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsOptional()
  firstName?: string | null;

  @IsOptional()
  lastName?: string | null;
}
