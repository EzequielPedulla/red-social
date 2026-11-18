import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Comentario } from '../../core/models/comentario.model';
import { Publicacion } from '../../core/models/publicacion.model';
import { AuthService } from '../../core/services/auth.service';
import { ComentariosService } from '../../core/services/comentarios.service';
import { PublicacionesService } from '../../core/services/publicaciones.service';
import { mensajesDeError } from '../../core/utils/errores';
import { ContadorComponent } from '../../shared/contador/contador.component';
import { ModalService } from '../../shared/modal/modal.service';
import { PostCardComponent } from '../../shared/post-card/post-card.component';

const POR_CARGA = 5;
const MAX_COMENTARIO = 500;

@Component({
  selector: 'app-publicacion',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, PostCardComponent, ContadorComponent],
  templateUrl: './publicacion.component.html',
  styleUrl: './publicacion.component.scss',
})
export class PublicacionComponent implements OnInit {
  // Llega desde la ruta (:id) gracias a withComponentInputBinding
  readonly id = input.required<string>();

  private readonly api = inject(PublicacionesService);
  private readonly comentariosApi = inject(ComentariosService);
  private readonly modal = inject(ModalService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly max = MAX_COMENTARIO;
  readonly publicacion = signal<Publicacion | null>(null);
  readonly noEncontrada = signal(false);

  readonly comentarios = signal<Comentario[]>([]);
  readonly total = signal(0);
  readonly cargandoMas = signal(false);
  readonly enviando = signal(false);
  readonly quedan = computed(() => this.total() > this.comentarios().length);

  readonly nuevo = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(MAX_COMENTARIO)],
  });

  // Edición en línea: solo un comentario a la vez
  readonly editandoId = signal<string | null>(null);
  readonly guardando = signal(false);
  readonly edicion = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(MAX_COMENTARIO)],
  });

  private likeEnCurso = false;

  // El input id recién está disponible en ngOnInit, no en el constructor
  ngOnInit(): void {
    if (!this.auth.logueado()) return;
    this.cargarPublicacion();
    this.cargarComentarios();
  }

  private cargarPublicacion(): void {
    this.api.obtener(this.id()).subscribe({
      next: (p) => this.publicacion.set(p),
      error: (e) => {
        this.noEncontrada.set(true);
        if (e?.status !== 404) this.modal.error('No se pudo cargar la publicación', mensajesDeError(e));
      },
    });
  }

  // Trae la siguiente tanda a continuación de lo que ya se muestra (nunca reemplaza lo anterior)
  cargarComentarios(): void {
    this.cargandoMas.set(true);
    this.comentariosApi
      .listar(this.id(), this.comentarios().length, POR_CARGA)
      .pipe(finalize(() => this.cargandoMas.set(false)))
      .subscribe({
        next: (r) => {
          const conocidos = new Set(this.comentarios().map((c) => c.id));
          this.comentarios.update((lista) => [...lista, ...r.items.filter((c) => !conocidos.has(c.id))]);
          this.total.set(r.total);
        },
        error: (e) => this.modal.error('No se pudieron cargar los comentarios', mensajesDeError(e)),
      });
  }

  comentar(): void {
    if (this.nuevo.invalid) {
      this.nuevo.markAsTouched();
      return;
    }
    this.enviando.set(true);
    this.comentariosApi
      .crear(this.id(), this.nuevo.value)
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: (c) => {
          // El más reciente va arriba
          this.comentarios.update((lista) => [c, ...lista]);
          this.total.update((n) => n + 1);
          this.nuevo.reset('');
        },
        error: (e) => this.modal.error('No se pudo comentar', mensajesDeError(e)),
      });
  }

  esMio(c: Comentario): boolean {
    return !!c.usuario && c.usuario.id === this.auth.usuario()?.id;
  }

  editar(c: Comentario): void {
    this.editandoId.set(c.id);
    this.edicion.setValue(c.mensaje);
  }

  cancelarEdicion(): void {
    this.editandoId.set(null);
  }

  guardarEdicion(c: Comentario): void {
    if (this.edicion.invalid) {
      this.edicion.markAsTouched();
      return;
    }
    this.guardando.set(true);
    this.comentariosApi
      .modificar(this.id(), c.id, this.edicion.value)
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: (actualizado) => {
          this.comentarios.update((lista) => lista.map((x) => (x.id === c.id ? actualizado : x)));
          this.editandoId.set(null);
        },
        error: (e) => this.modal.error('No se pudo editar el comentario', mensajesDeError(e)),
      });
  }

  alternarLike(p: Publicacion): void {
    if (this.likeEnCurso) return;
    this.likeEnCurso = true;
    const peticion = p.meGusta ? this.api.quitarLike(p.id) : this.api.darLike(p.id);
    peticion.pipe(finalize(() => (this.likeEnCurso = false))).subscribe({
      next: (actualizada) => this.publicacion.set(actualizada),
      error: (e) => this.modal.error('No se pudo registrar el me gusta', mensajesDeError(e)),
    });
  }

  puedeEliminar(p: Publicacion): boolean {
    return this.auth.esAdmin() || p.usuario?.id === this.auth.usuario()?.id;
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
      next: () => this.router.navigate(['/publicaciones']),
      error: (e) => this.modal.error('No se pudo eliminar', mensajesDeError(e)),
    });
  }
}
