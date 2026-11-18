import {
  Body, Controller, Get, HttpStatus, ParseFilePipeBuilder, Patch, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { UsuarioActual } from '../auth/usuario-actual.decorator.js';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto.js';
import { UsuariosService } from './usuarios.service.js';

@UseGuards(JwtAuthGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get('me')
  miPerfil(@UsuarioActual() actual: UsuarioActual) {
    return this.usuarios.buscarPorId(actual.id);
  }

  // multipart/form-data: campos de texto opcionales + "imagen" opcional (máx 3MB)
  @Patch('me')
  @UseInterceptors(FileInterceptor('imagen'))
  actualizarPerfil(
    @Body() dto: ActualizarPerfilDto,
    @UsuarioActual() actual: UsuarioActual,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif)$/ })
        .addMaxSizeValidator({ maxSize: 3 * 1024 * 1024 })
        .build({ fileIsRequired: false, errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
    )
    imagen?: Express.Multer.File,
  ) {
    return this.usuarios.actualizarPerfil(actual.id, dto, imagen);
  }
}
