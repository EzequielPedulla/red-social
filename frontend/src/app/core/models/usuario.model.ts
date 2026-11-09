export type Perfil = 'usuario' | 'administrador';

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  nombreUsuario: string;
  fechaNacimiento: string;
  descripcion: string;
  imagenPerfil: string;
  perfil: Perfil;
  activo: boolean;
}

export interface AuthResponse {
  usuario: Usuario;
  token: string;
}

export interface LoginDto {
  identificador: string;
  password: string;
}
