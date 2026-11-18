import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CloudinaryService } from '../common/cloudinary.service.js';
import { Usuario, UsuarioSchema } from './schemas/usuario.schema.js';
import { UsuariosController } from './usuarios.controller.js';
import { UsuariosService } from './usuarios.service.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: Usuario.name, schema: UsuarioSchema }])],
  controllers: [UsuariosController],
  providers: [UsuariosService, CloudinaryService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
