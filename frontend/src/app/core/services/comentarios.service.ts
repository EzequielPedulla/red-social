import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Comentario, PaginaComentarios } from '../models/comentario.model';

@Injectable({ providedIn: 'root' })
export class ComentariosService {
  private readonly http = inject(HttpClient);

  private url(publicacionId: string): string {
    return `${environment.apiUrl}/publicaciones/${publicacionId}/comentarios`;
  }

  listar(publicacionId: string, offset: number, limit: number) {
    const params = new HttpParams().set('offset', offset).set('limit', limit);
    return this.http.get<PaginaComentarios>(this.url(publicacionId), { params });
  }

  crear(publicacionId: string, mensaje: string) {
    return this.http.post<Comentario>(this.url(publicacionId), { mensaje });
  }

  modificar(publicacionId: string, comentarioId: string, mensaje: string) {
    return this.http.put<Comentario>(`${this.url(publicacionId)}/${comentarioId}`, { mensaje });
  }
}
