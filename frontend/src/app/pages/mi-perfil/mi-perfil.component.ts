import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Publicacion } from '../../core/models/publicacion.model';
import { AuthService } from '../../core/services/auth.service';
import { PublicacionesService } from '../../core/services/publicaciones.service';
import { mensajesDeError } from '../../core/utils/errores';
import { ModalService } from '../../shared/modal/modal.service';
import { PostCardComponent } from '../../shared/post-card/post-card.component';

@Component({
  selector: 'app-mi-perfil',
  imports: [DatePipe, RouterLink, PostCardComponent],
  templateUrl: './mi-perfil.component.html',
  styleUrl: './mi-perfil.component.scss',
})
export class MiPerfilComponent {
  private readonly api = inject(PublicacionesService);
  private readonly modal = inject(ModalService);
  readonly usuario = inject(AuthService).usuario;

  readonly ultimas = signal<Publicacion[]>([]);
  private readonly likesEnCurso = new Set<string>();

  constructor() {
    this.cargar();
  }

  // Últimas 3 publicaciones del usuario: filtro por usuario + orden por fecha + limit 3
  private cargar(): void {
    const u = this.usuario();
    if (!u) return;
    this.api.listar({ orden: 'fecha', offset: 0, limit: 3, usuario: u.id }).subscribe({
      next: (r) => this.ultimas.set(r.items),
      error: (e) => this.modal.error('No se pudieron cargar tus publicaciones', mensajesDeError(e)),
    });
  }

  alternarLike(p: Publicacion): void {
    if (this.likesEnCurso.has(p.id)) return;
    this.likesEnCurso.add(p.id);
    const peticion = p.meGusta ? this.api.quitarLike(p.id) : this.api.darLike(p.id);
    peticion.pipe(finalize(() => this.likesEnCurso.delete(p.id))).subscribe({
      next: (actualizada) =>
        this.ultimas.update((lista) => lista.map((x) => (x.id === p.id ? actualizada : x))),
      error: (e) => this.modal.error('No se pudo registrar el me gusta', mensajesDeError(e)),
    });
  }

  async eliminar(p: Publicacion): Promise<void> {
    const ok = await this.modal.mostrar({
      titulo: 'Eliminar publicación',
      mensajes: [`¿Seguro que querés eliminar "${p.titulo}"?`],
      textoAceptar: 'Eliminar',
      textoCancelar: 'Cancelar',
    });
    if (!ok) return;
    this.api.eliminar(p.id).subscribe({
      next: () => this.cargar(),
      error: (e) => this.modal.error('No se pudo eliminar', mensajesDeError(e)),
    });
  }
}
