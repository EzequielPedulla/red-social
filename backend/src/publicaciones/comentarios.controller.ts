import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { UsuarioActual } from '../auth/usuario-actual.decorator.js';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe.js';
import { ComentariosService } from './comentarios.service.js';
import { ComentarioDto, ListarComentariosDto } from './dto/comentario.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('publicaciones/:publicacionId/comentarios')
export class ComentariosController {
  constructor(private readonly comentarios: ComentariosService) {}

  // Paginado (offset/limit), más recientes primero
  @Get()
  listar(
    @Param('publicacionId', ParseObjectIdPipe) publicacionId: string,
    @Query() filtros: ListarComentariosDto,
  ) {
    return this.comentarios.listar(publicacionId, filtros);
  }

  @Post()
  crear(
    @Param('publicacionId', ParseObjectIdPipe) publicacionId: string,
    @Body() dto: ComentarioDto,
    @UsuarioActual() usuario: UsuarioActual,
  ) {
    return this.comentarios.crear(publicacionId, dto, usuario.id);
  }

  // Modifica el mensaje y marca modificado: true
  @Put(':id')
  modificar(
    @Param('publicacionId', ParseObjectIdPipe) publicacionId: string,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: ComentarioDto,
    @UsuarioActual() usuario: UsuarioActual,
  ) {
    return this.comentarios.modificar(publicacionId, id, dto, usuario.id);
  }
}
