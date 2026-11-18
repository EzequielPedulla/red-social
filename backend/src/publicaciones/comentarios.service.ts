import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ComentarioDto, ListarComentariosDto } from './dto/comentario.dto.js';
import { Comentario } from './schemas/comentario.schema.js';
import { Publicacion } from './schemas/publicacion.schema.js';

const CAMPOS_AUTOR = 'nombre apellido nombreUsuario imagenPerfil';

@Injectable()
export class ComentariosService {
  constructor(
    @InjectModel(Comentario.name) private readonly comentarios: Model<Comentario>,
    @InjectModel(Publicacion.name) private readonly publicaciones: Model<Publicacion>,
  ) {}

  async listar(publicacionId: string, { offset = 0, limit = 5 }: ListarComentariosDto) {
    await this.verificarPublicacion(publicacionId);
    const condicion = { publicacion: publicacionId, activo: true };
    const [items, total] = await Promise.all([
      this.comentarios
        .find(condicion)
        // Más recientes primero; _id desempata comentarios con la misma fecha
        .sort({ createdAt: -1, _id: -1 })
        .skip(offset)
        .limit(limit)
        .populate('usuario', CAMPOS_AUTOR)
        .lean()
        .exec(),
      this.comentarios.countDocuments(condicion).exec(),
    ]);
    return { items: items.map((c) => this.aRespuesta(c)), total, offset, limit };
  }

  async crear(publicacionId: string, dto: ComentarioDto, usuarioId: string) {
    await this.verificarPublicacion(publicacionId);
    const creado = await this.comentarios.create({
      publicacion: publicacionId,
      usuario: usuarioId,
      mensaje: dto.mensaje,
    });
    return this.obtener(String(creado._id));
  }

  // Solo el autor puede modificar su comentario
  async modificar(publicacionId: string, id: string, dto: ComentarioDto, usuarioId: string) {
    const comentario = await this.comentarios
      .findOne({ _id: id, publicacion: publicacionId, activo: true })
      .exec();
    if (!comentario) throw new NotFoundException('Comentario no encontrado');
    if (String(comentario.usuario) !== usuarioId) {
      throw new ForbiddenException('Solo podés editar tus propios comentarios');
    }
    comentario.mensaje = dto.mensaje;
    comentario.modificado = true;
    await comentario.save();
    return this.obtener(id);
  }

  private async obtener(id: string) {
    const c = await this.comentarios.findById(id).populate('usuario', CAMPOS_AUTOR).lean().exec();
    if (!c) throw new NotFoundException('Comentario no encontrado');
    return this.aRespuesta(c);
  }

  private async verificarPublicacion(id: string): Promise<void> {
    const existe = await this.publicaciones.exists({ _id: id, activo: true });
    if (!existe) throw new NotFoundException('Publicación no encontrada');
  }

  private aRespuesta(c: any) {
    const { _id, __v, activo, publicacion, usuario, ...resto } = c;
    const { _id: autorId, ...autor } = usuario ?? {};
    return {
      ...resto,
      id: String(_id),
      publicacion: String(publicacion),
      usuario: usuario && { id: String(autorId), ...autor },
    };
  }
}
