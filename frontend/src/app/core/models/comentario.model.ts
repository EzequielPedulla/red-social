import { AutorPublicacion } from './publicacion.model';

export interface Comentario {
  id: string;
  publicacion: string;
  // null si el autor ya no existe
  usuario: AutorPublicacion | null;
  mensaje: string;
  // true si el autor lo editó después de publicarlo
  modificado: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginaComentarios {
  items: Comentario[];
  total: number;
  offset: number;
  limit: number;
}
