import { IsEmail, MinLength } from 'class-validator';
import { SignUpInput } from '../graphql.schema.generated';

export class SignUpInputDto extends SignUpInput {
  @IsEmail()
  readonly email: string;

  @MinLength(6)
  readonly password: string;
}
