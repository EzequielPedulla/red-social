import {
  Body, Controller, HttpCode, HttpStatus, ParseFilePipeBuilder, Post, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { UsuarioActual } from './usuario-actual.decorator.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // multipart/form-data: campos de texto + archivo "imagen" (opcional, máx 3MB)
  @Post('registro')
  @UseInterceptors(FileInterceptor('imagen'))
  registro(
    @Body() dto: RegisterDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif)$/ })
        .addMaxSizeValidator({ maxSize: 3 * 1024 * 1024 })
        .build({ fileIsRequired: false, errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
    )
    imagen?: Express.Multer.File,
  ) {
    return this.auth.registrar(dto, imagen);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  // 401 si el token es inválido o venció; si es válido devuelve los datos del usuario
  @UseGuards(JwtAuthGuard)
  @Post('autorizar')
  @HttpCode(HttpStatus.OK)
  autorizar(@UsuarioActual() actual: UsuarioActual) {
    return this.auth.autorizar(actual.id);
  }

  // Devuelve un token nuevo con el mismo payload y 15 minutos de vida
  @UseGuards(JwtAuthGuard)
  @Post('refrescar')
  @HttpCode(HttpStatus.OK)
  refrescar(@UsuarioActual() actual: UsuarioActual) {
    return this.auth.refrescar(actual.id, actual.perfil);
  }
}
