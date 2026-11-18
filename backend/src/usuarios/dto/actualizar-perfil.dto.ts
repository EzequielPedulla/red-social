import { IsDateString, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

// Todos los campos son opcionales: solo se modifica lo que llega
export class ActualizarPerfilDto {
  @IsOptional() @IsString() @Matches(/\S/, { message: 'El nombre es obligatorio' }) @MaxLength(50)
  nombre?: string;

  @IsOptional() @IsString() @Matches(/\S/, { message: 'El apellido es obligatorio' }) @MaxLength(50)
  apellido?: string;

  @IsOptional() @IsString() @MinLength(3) @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_.]+$/, { message: 'El nombre de usuario solo admite letras, números, _ y .' })
  nombreUsuario?: string;

  @IsOptional() @IsDateString({}, { message: 'La fecha de nacimiento no es válida' })
  fechaNacimiento?: string;

  @IsOptional() @IsString() @Matches(/\S/, { message: 'La descripción es obligatoria' }) @MaxLength(200)
  descripcion?: string;
}
