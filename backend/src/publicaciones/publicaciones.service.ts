import {
  ConflictException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsuarioActual } from '../auth/usuario-actual.decorator.js';
import { CloudinaryService } from '../common/cloudinary.service.js';
import { CreatePublicacionDto } from './dto/create-publicacion.dto.js';
import { ListarPublicacionesDto } from './dto/listar-publicaciones.dto.js';
import { Publicacion } from './schemas/publicacion.schema.js';

const CAMPOS_AUTOR = 'nombre apellido nombreUsuario imagenPerfil';

@Injectable()
export class PublicacionesService {
  constructor(
    @InjectModel(Publicacion.name) private readonly modelo: Model<Publicacion>,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async crear(dto: CreatePublicacionDto, usuarioId: string, imagen?: Express.Multer.File) {
    const urlImagen = imagen ? await this.cloudinary.subirImagen(imagen, 'publicaciones') : '';
    const creada = await this.modelo.create({ ...dto, usuario: usuarioId, imagen: urlImagen });
    return this.obtener(String(creada._id), usuarioId);
  }

  async listar(filtros: ListarPublicacionesDto, usuarioId: string) {
    const { orden = 'fecha', offset = 0, limit = 10, usuario } = filtros;
    const condicion: Record<string, unknown> = { activo: true };
    if (usuario) condicion.usuario = usuario;

    // Desempate por fecha para que la paginación sea estable cuando hay igual cantidad de likes
    const ordenamiento: Record<string, 1 | -1> =
      orden === 'likes' ? { cantidadLikes: -1, createdAt: -1 } : { createdAt: -1 };

    const [publicaciones, total] = await Promise.all([
      this.modelo
        .find(condicion)
        .sort(ordenamiento)
        .skip(offset)
        .limit(limit)
        .populate('usuario', CAMPOS_AUTOR)
        .lean()
        .exec(),
      this.modelo.countDocuments(condicion).exec(),
    ]);

    return {
      items: publicaciones.map((p) => this.aRespuesta(p, usuarioId)),
      total,
      offset,
      limit,
    };
  }

  // Baja lógica: solo el autor o un administrador
  async eliminar(id: string, actual: UsuarioActual): Promise<void> {
    const publicacion = await this.modelo.findOne({ _id: id, activo: true }).exec();
    if (!publicacion) throw new NotFoundException('Publicación no encontrada');

    const esAutor = String(publicacion.usuario) === actual.id;
    if (!esAutor && actual.perfil !== 'administrador') {
      throw new ForbiddenException('Solo podés eliminar tus propias publicaciones');
    }
    publicacion.activo = false;
    await publicacion.save();
  }

  async darLike(id: string, usuarioId: string) {
    // Una sola operación atómica: solo actúa si el usuario todavía no había dado like
    const resultado = await this.modelo
      .updateOne(
        { _id: id, activo: true, likes: { $ne: new Types.ObjectId(usuarioId) } },
        { $addToSet: { likes: new Types.ObjectId(usuarioId) }, $inc: { cantidadLikes: 1 } },
      )
      .exec();

    if (resultado.modifiedCount === 0) {
      await this.verificarExiste(id);
      throw new ConflictException('Ya le diste me gusta a esta publicación');
    }
    return this.obtener(id, usuarioId);
  }

  async quitarLike(id: string, usuarioId: string) {
    const resultado = await this.modelo
      .updateOne(
        { _id: id, activo: true, likes: new Types.ObjectId(usuarioId) },
        { $pull: { likes: new Types.ObjectId(usuarioId) }, $inc: { cantidadLikes: -1 } },
      )
      .exec();

    if (resultado.modifiedCount === 0) {
      await this.verificarExiste(id);
      throw new ConflictException('No le habías dado me gusta a esta publicación');
    }
    return this.obtener(id, usuarioId);
  }

  private async obtener(id: string, usuarioId: string) {
    const p = await this.modelo
      .findOne({ _id: id, activo: true })
      .populate('usuario', CAMPOS_AUTOR)
      .lean()
      .exec();
    if (!p) throw new NotFoundException('Publicación no encontrada');
    return this.aRespuesta(p, usuarioId);
  }

  private async verificarExiste(id: string): Promise<void> {
    const existe = await this.modelo.exists({ _id: id, activo: true });
    if (!existe) throw new NotFoundException('Publicación no encontrada');
  }

  // Filtro de salida: el cliente no recibe el array de likes ni metadatos de Mongo,
  // solo la cantidad y si el usuario que consulta ya dio like
  private aRespuesta(p: any, usuarioId: string) {
    const { _id, __v, likes, activo, usuario, ...resto } = p;
    return {
      ...resto,
      id: String(_id),
      usuario: usuario && { id: String(usuario._id), ...omitirId(usuario) },
      meGusta: (likes as Types.ObjectId[]).some((l) => String(l) === usuarioId),
    };
  }
}

function omitirId({ _id, ...resto }: Record<string, unknown>) {
  return resto;
}
