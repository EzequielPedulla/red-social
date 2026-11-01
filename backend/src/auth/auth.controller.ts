import {
  Body, Controller, HttpCode, HttpStatus, ParseFilePipeBuilder, Post, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
}
