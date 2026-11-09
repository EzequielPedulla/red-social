export interface AutorPublicacion {
  id: string;
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  imagenPerfil: string;
}

export interface Publicacion {
  id: string;
  usuario: AutorPublicacion;
  titulo: string;
  mensaje: string;
  imagen: string;
  cantidadLikes: number;
  meGusta: boolean;
  createdAt: string;
}

export interface PaginaPublicaciones {
  items: Publicacion[];
  total: number;
  offset: number;
  limit: number;
}

export type OrdenPublicaciones = 'fecha' | 'likes';
