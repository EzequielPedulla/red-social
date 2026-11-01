import { IsDateString, IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export const REGEX_PASSWORD = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
const MSG_PASSWORD = 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número';

export class RegisterDto {
  @IsString() @Matches(/\S/, { message: 'El nombre es obligatorio' }) @MaxLength(50)
  nombre!: string;

  @IsString() @Matches(/\S/, { message: 'El apellido es obligatorio' }) @MaxLength(50)
  apellido!: string;

  @IsEmail({}, { message: 'El correo no es válido' })
  correo!: string;

  @IsString() @MinLength(3) @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_.]+$/, { message: 'El nombre de usuario solo admite letras, números, _ y .' })
  nombreUsuario!: string;

  @IsString() @Matches(REGEX_PASSWORD, { message: MSG_PASSWORD })
  password!: string;

  @IsString()
  repetirPassword!: string;

  @IsDateString({}, { message: 'La fecha de nacimiento no es válida' })
  fechaNacimiento!: string;

  @IsString() @Matches(/\S/, { message: 'La descripción es obligatoria' }) @MaxLength(200)
  descripcion!: string;
}
