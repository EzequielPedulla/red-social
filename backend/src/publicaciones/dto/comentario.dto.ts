import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

// Sirve para POST (crear) y PUT (modificar)
export class ComentarioDto {
  @IsString()
  @Matches(/\S/, { message: 'El comentario no puede estar vacío' })
  @MaxLength(500, { message: 'El comentario no puede superar los 500 caracteres' })
  mensaje!: string;
}

// Parámetros de query de GET /publicaciones/:id/comentarios
export class ListarComentariosDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  offset?: number = 0;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)
  limit?: number = 5;
}
