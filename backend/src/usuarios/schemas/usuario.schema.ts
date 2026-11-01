import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UsuarioDocument = HydratedDocument<Usuario>;
export type Perfil = 'usuario' | 'administrador';

@Schema({
  timestamps: true,
  toJSON: {
    // Filtro de salida: el cliente nunca recibe el hash ni metadatos de Mongo
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = String(ret._id);
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    },
  },
})
export class Usuario {
  @Prop({ required: true, trim: true })
  nombre!: string;

  @Prop({ required: true, trim: true })
  apellido!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  correo!: string;

  @Prop({ required: true, unique: true, trim: true })
  nombreUsuario!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ required: true })
  fechaNacimiento!: Date;

  @Prop({ required: true, trim: true })
  descripcion!: string;

  @Prop({ default: '' })
  imagenPerfil!: string;

  @Prop({ required: true, enum: ['usuario', 'administrador'], default: 'usuario' })
  perfil!: Perfil;

  // Baja lógica (Sprint 4)
  @Prop({ default: true })
  activo!: boolean;
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);
