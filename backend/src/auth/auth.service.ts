import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { CloudinaryService } from '../common/cloudinary.service.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarios: UsuariosService,
    private readonly jwt: JwtService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async registrar(dto: RegisterDto, imagen?: Express.Multer.File) {
    if (dto.password !== dto.repetirPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }
    const { repetirPassword: _omitido, ...datos } = dto;
    const imagenPerfil = imagen ? await this.cloudinary.subirImagen(imagen, 'perfiles') : '';

    const usuario = await this.usuarios.crear({
      ...datos,
      fechaNacimiento: new Date(dto.fechaNacimiento),
      password: await bcrypt.hash(dto.password, 10),
      imagenPerfil,
    });
    return { usuario, token: this.firmarToken(usuario.id, usuario.perfil) };
  }

  async login(dto: LoginDto) {
    const usuario = await this.usuarios.buscarPorIdentificador(dto.identificador);
    // Mismo mensaje para usuario inexistente o clave errónea: no revela cuál falló
    if (!usuario || !(await bcrypt.compare(dto.password, usuario.password))) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }
    if (!usuario.activo) {
      throw new ForbiddenException('Tu usuario está deshabilitado. Contactá a un administrador');
    }
    return { usuario, token: this.firmarToken(usuario.id, usuario.perfil) };
  }

  // POST /auth/autorizar: el guard ya validó firma y vencimiento; acá se confirma que el usuario siga habilitado
  async autorizar(id: string) {
    return { usuario: await this.usuarioHabilitado(id) };
  }

  // POST /auth/refrescar: mismo payload, nuevo vencimiento de 15 minutos
  async refrescar(id: string, perfil: string) {
    await this.usuarioHabilitado(id);
    return { token: this.firmarToken(id, perfil) };
  }

  private async usuarioHabilitado(id: string) {
    const usuario = await this.usuarios.buscarPorId(id).catch(() => null);
    if (!usuario || !usuario.activo) throw new UnauthorizedException('Sesión no válida');
    return usuario;
  }

  private firmarToken(id: string, perfil: string): string {
    return this.jwt.sign({ sub: id, perfil });
  }
}
