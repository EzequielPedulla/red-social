import { Type } from 'class-transformer';
import { IsIn, IsInt, IsMongoId, IsOptional, Max, Min } from 'class-validator';

// Parámetros de query de GET /publicaciones
export class ListarPublicacionesDto {
  @IsOptional()
  @IsIn(['fecha', 'likes'], { message: 'orden debe ser "fecha" o "likes"' })
  orden?: 'fecha' | 'likes' = 'fecha';

  // Cuántas publicaciones saltear (la query string llega como texto: @Type la pasa a número)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  // Filtra las publicaciones de un usuario (id de Mongo)
  @IsOptional()
  @IsMongoId({ message: 'usuario no es un id válido' })
  usuario?: string;
}
