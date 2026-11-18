import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CloudinaryService } from '../common/cloudinary.service.js';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto.js';
import { Usuario, UsuarioDocument } from './schemas/usuario.schema.js';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name) private readonly modelo: Model<Usuario>,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async crear(datos: Partial<Usuario>): Promise<UsuarioDocument> {
    const existente = await this.modelo
      .findOne({ $or: [{ correo: datos.correo?.toLowerCase() }, { nombreUsuario: datos.nombreUsuario }] })
      .exec();
    if (existente) {
      const campo = existente.correo === datos.correo?.toLowerCase() ? 'correo' : 'nombre de usuario';
      throw new ConflictException(`El ${campo} ya está registrado`);
    }
    return this.modelo.create(datos);
  }

  // Login: acepta correo o nombre de usuario
  buscarPorIdentificador(identificador: string): Promise<UsuarioDocument | null> {
    const valor = identificador.trim();
    return this.modelo
      .findOne({ $or: [{ correo: valor.toLowerCase() }, { nombreUsuario: valor }] })
      .exec();
  }

  async buscarPorId(id: string): Promise<UsuarioDocument> {
    const usuario = await this.modelo.findById(id).exec();
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  // Edita solo los datos personales del usuario autenticado (no correo, clave ni perfil)
  async actualizarPerfil(id: string, dto: ActualizarPerfilDto, imagen?: Express.Multer.File) {
    const usuario = await this.buscarPorId(id);

    if (dto.nombreUsuario && dto.nombreUsuario !== usuario.nombreUsuario) {
      const ocupado = await this.modelo.exists({ nombreUsuario: dto.nombreUsuario, _id: { $ne: id } });
      if (ocupado) throw new ConflictException('El nombre de usuario ya está registrado');
    }

    const { fechaNacimiento, ...resto } = dto;
    Object.assign(usuario, resto);
    if (fechaNacimiento) usuario.fechaNacimiento = new Date(fechaNacimiento);
    if (imagen) usuario.imagenPerfil = await this.cloudinary.subirImagen(imagen, 'perfiles');
    return usuario.save();
  }
}
