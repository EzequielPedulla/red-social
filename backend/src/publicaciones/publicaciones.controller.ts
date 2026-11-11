import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseFilePipeBuilder, Post, Query,
  UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { UsuarioActual } from '../auth/usuario-actual.decorator.js';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe.js';
import { CreatePublicacionDto } from './dto/create-publicacion.dto.js';
import { ListarPublicacionesDto } from './dto/listar-publicaciones.dto.js';
import { PublicacionesService } from './publicaciones.service.js';

// Todas las rutas exigen un token válido
@UseGuards(JwtAuthGuard)
@Controller('publicaciones')
export class PublicacionesController {
  constructor(private readonly publicaciones: PublicacionesService) {}

  // multipart/form-data: titulo, mensaje e "imagen" opcional (máx 3MB)
  @Post()
  @UseInterceptors(FileInterceptor('imagen'))
  crear(
    @Body() dto: CreatePublicacionDto,
    @UsuarioActual() usuario: UsuarioActual,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif)$/ })
        .addMaxSizeValidator({ maxSize: 3 * 1024 * 1024 })
        .build({ fileIsRequired: false, errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
    )
    imagen?: Express.Multer.File,
  ) {
    return this.publicaciones.crear(dto, usuario.id, imagen);
  }

  @Get()
  listar(@Query() filtros: ListarPublicacionesDto, @UsuarioActual() usuario: UsuarioActual) {
    return this.publicaciones.listar(filtros, usuario.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', ParseObjectIdPipe) id: string, @UsuarioActual() usuario: UsuarioActual) {
    return this.publicaciones.eliminar(id, usuario);
  }

  @Post(':id/like')
  darLike(@Param('id', ParseObjectIdPipe) id: string, @UsuarioActual() usuario: UsuarioActual) {
    return this.publicaciones.darLike(id, usuario.id);
  }

  @Delete(':id/like')
  quitarLike(@Param('id', ParseObjectIdPipe) id: string, @UsuarioActual() usuario: UsuarioActual) {
    return this.publicaciones.quitarLike(id, usuario.id);
  }
}
