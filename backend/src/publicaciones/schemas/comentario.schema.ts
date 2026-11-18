import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type ComentarioDocument = HydratedDocument<Comentario>;

@Schema({ timestamps: true })
export class Comentario {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Publicacion', required: true, index: true })
  publicacion!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Usuario', required: true })
  usuario!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 500 })
  mensaje!: string;

  // Se pone en true la primera vez que el autor edita el comentario
  @Prop({ default: false })
  modificado!: boolean;

  // Baja lógica (Sprint 4: al dar de baja una publicación dejan de estar disponibles sus comentarios)
  @Prop({ default: true })
  activo!: boolean;
}

export const ComentarioSchema = SchemaFactory.createForClass(Comentario);
// Cubre la consulta del listado: comentarios de una publicación, los más recientes primero
ComentarioSchema.index({ publicacion: 1, createdAt: -1 });
