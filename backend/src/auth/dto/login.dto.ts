import { IsString, Matches } from 'class-validator';
import { REGEX_PASSWORD } from './register.dto.js';

export class LoginDto {
  // correo o nombre de usuario
  @IsString() @Matches(/\S/, { message: 'Ingresá tu correo o nombre de usuario' })
  identificador!: string;

  @IsString() @Matches(REGEX_PASSWORD, { message: 'Contraseña inválida' })
  password!: string;
}
