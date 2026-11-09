import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { OrdenPublicaciones, PaginaPublicaciones, Publicacion } from '../models/publicacion.model';

@Injectable({ providedIn: 'root' })
export class PublicacionesService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/publicaciones`;

  // El token lo agrega el interceptor, acá no hace falta tocarlo
  listar(opciones: { orden: OrdenPublicaciones; offset: number; limit: number; usuario?: string }) {
    let params = new HttpParams()
      .set('orden', opciones.orden)
      .set('offset', opciones.offset)
      .set('limit', opciones.limit);
    if (opciones.usuario) params = params.set('usuario', opciones.usuario);
    return this.http.get<PaginaPublicaciones>(this.api, { params });
  }

  // multipart/form-data porque puede llevar una imagen
  crear(datos: FormData) {
    return this.http.post<Publicacion>(this.api, datos);
  }

  eliminar(id: string) {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  darLike(id: string) {
    return this.http.post<Publicacion>(`${this.api}/${id}/like`, {});
  }

  quitarLike(id: string) {
    return this.http.delete<Publicacion>(`${this.api}/${id}/like`);
  }
}
