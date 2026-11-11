import { IsString, Matches, MaxLength } from 'class-validator';

export class CreatePublicacionDto {
  @IsString()
  @Matches(/\S/, { message: 'El título es obligatorio' })
  @MaxLength(100, { message: 'El título no puede superar los 100 caracteres' })
  titulo!: string;

  @IsString()
  @Matches(/\S/, { message: 'El mensaje es obligatorio' })
  @MaxLength(1000, { message: 'El mensaje no puede superar los 1000 caracteres' })
  mensaje!: string;
}
