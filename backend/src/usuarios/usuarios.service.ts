import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario, UsuarioDocument } from './schemas/usuario.schema.js';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name) private readonly modelo: Model<Usuario>,
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
}
