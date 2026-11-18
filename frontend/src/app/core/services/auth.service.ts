import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginDto, Usuario } from '../models/usuario.model';

const CLAVE_TOKEN = 'token';
const CLAVE_USUARIO = 'usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/auth`;

  readonly token = signal<string | null>(this.leer(CLAVE_TOKEN));
  readonly usuario = signal<Usuario | null>(this.parsear(this.leer(CLAVE_USUARIO)));
  readonly logueado = computed(() => !!this.token());
  readonly esAdmin = computed(() => this.usuario()?.perfil === 'administrador');

  // El registro viaja como multipart/form-data porque incluye la imagen de perfil
  registro(datos: FormData) {
    return this.http
      .post<AuthResponse>(`${this.api}/registro`, datos)
      .pipe(tap((r) => this.guardarSesion(r)));
  }

  login(datos: LoginDto) {
    return this.http
      .post<AuthResponse>(`${this.api}/login`, datos)
      .pipe(tap((r) => this.guardarSesion(r)));
  }

  // Valida el token guardado contra el back (401 si es inválido o venció) y trae los datos del usuario
  autorizar() {
    return this.http.post<{ usuario: Usuario }>(`${this.api}/autorizar`, {}).pipe(
      tap((r) => {
        this.usuario.set(r.usuario);
        this.escribir(CLAVE_USUARIO, JSON.stringify(r.usuario));
      }),
    );
  }

  // Cambia el token por uno nuevo con 15 minutos de vida
  refrescar() {
    return this.http.post<{ token: string }>(`${this.api}/refrescar`, {}).pipe(
      tap((r) => {
        this.token.set(r.token);
        this.escribir(CLAVE_TOKEN, r.token);
      }),
    );
  }

  // Edición de perfil: devuelve el usuario actualizado y lo refleja en la sesión (navbar, perfil)
  actualizarPerfil(datos: FormData) {
    return this.http.patch<Usuario>(`${environment.apiUrl}/usuarios/me`, datos).pipe(
      tap((u) => {
        this.usuario.set(u);
        this.escribir(CLAVE_USUARIO, JSON.stringify(u));
      }),
    );
  }

  logout(): void {
    this.token.set(null);
    this.usuario.set(null);
    this.borrar(CLAVE_TOKEN);
    this.borrar(CLAVE_USUARIO);
  }

  private guardarSesion(r: AuthResponse): void {
    this.token.set(r.token);
    this.usuario.set(r.usuario);
    this.escribir(CLAVE_TOKEN, r.token);
    this.escribir(CLAVE_USUARIO, JSON.stringify(r.usuario));
  }

  // localStorage puede fallar (modo privado, bloqueado): nunca debe romper la app
  private leer(clave: string): string | null {
    try {
      return localStorage.getItem(clave);
    } catch {
      return null;
    }
  }
  private escribir(clave: string, valor: string): void {
    try {
      localStorage.setItem(clave, valor);
    } catch {}
  }
  private borrar(clave: string): void {
    try {
      localStorage.removeItem(clave);
    } catch {}
  }
  private parsear(json: string | null): Usuario | null {
    try {
      return json ? (JSON.parse(json) as Usuario) : null;
    } catch {
      return null;
    }
  }
}
