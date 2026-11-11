import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type PublicacionDocument = HydratedDocument<Publicacion>;

@Schema({ timestamps: true })
export class Publicacion {
  // Relación con el autor: guardamos solo su _id y luego hacemos populate
  // OJO: hay que usar Schema.Types.ObjectId (el tipo del schema) y NO Types.ObjectId (la clase de bson).
  // Con el segundo, Mongoose no convierte los ids al consultar y los filtros por usuario no encuentran nada.
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Usuario', required: true, index: true })
  usuario!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 100 })
  titulo!: string;

  @Prop({ required: true, trim: true, maxlength: 1000 })
  mensaje!: string;

  // URL en Cloudinary (vacía si la publicación no tiene imagen)
  @Prop({ default: '' })
  imagen!: string;

  // Quiénes dieron me gusta. Un usuario aparece una sola vez (se usa $addToSet)
  @Prop({ type: [MongooseSchema.Types.ObjectId], default: [] })
  likes!: Types.ObjectId[];

  // Contador desnormalizado: permite ordenar por "más me gusta" sin calcular nada
  @Prop({ default: 0, index: true })
  cantidadLikes!: number;

  // Baja lógica: nunca se borra el documento, solo se marca
  @Prop({ default: true, index: true })
  activo!: boolean;
}

export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);
