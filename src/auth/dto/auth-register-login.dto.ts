import { IsEmail, IsNotEmpty, MinLength, Validate } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotExist } from '../../utils/validators/is-not-exists.validator';
import { Country } from '../../countries/entities/country.entity';

export class AuthRegisterLoginDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @Transform(({ value }) => {
    return value.toLowerCase().trim();
  })
  @Validate(IsNotExist, ['User'], {
    message:
      'Failed to create account. Please try again later or contact support for assistance.',
  })
  @IsEmail({}, { message: 'A valid email address required' })
  email: string;

  @ApiProperty()
  @MinLength(6, { message: 'A valid password is required' })
  password: string;

  @ApiProperty({ example: 'John' })
  @IsNotEmpty({ message: 'User first name required' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty({ message: 'User last name required' })
  lastName: string;

  @ApiProperty({ type: Country, example: { id: 1 } })
  @IsNotEmpty({ message: 'Country is required' })
  country: Country;
}
