import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { OrdenPublicaciones, Publicacion } from '../../core/models/publicacion.model';
import { AuthService } from '../../core/services/auth.service';
import { PublicacionesService } from '../../core/services/publicaciones.service';
import { mensajesDeError } from '../../core/utils/errores';
import { ModalService } from '../../shared/modal/modal.service';
import { PostCardComponent } from '../../shared/post-card/post-card.component';

const POR_PAGINA = 10;

@Component({
  selector: 'app-publicaciones',
  imports: [ReactiveFormsModule, RouterLink, PostCardComponent],
  templateUrl: './publicaciones.component.html',
})
export class PublicacionesComponent {
  private readonly api = inject(PublicacionesService);
  private readonly modal = inject(ModalService);
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);

  readonly publicaciones = signal<Publicacion[]>([]);
  readonly total = signal(0);
  readonly orden = signal<OrdenPublicaciones>('fecha');
  readonly pagina = signal(1);
  readonly cargando = signal(false);
  readonly publicando = signal(false);
  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / POR_PAGINA)));

  private imagen: File | null = null;
  private readonly likesEnCurso = new Set<string>();

  readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(100)]],
    mensaje: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  constructor() {
    if (this.auth.logueado()) this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.api
      .listar({ orden: this.orden(), offset: (this.pagina() - 1) * POR_PAGINA, limit: POR_PAGINA })
      .subscribe({
        next: (r) => {
          this.publicaciones.set(r.items);
          this.total.set(r.total);
          this.cargando.set(false);
        },
        error: (e) => {
          this.cargando.set(false);
          this.modal.error('No se pudieron cargar las publicaciones', mensajesDeError(e));
        },
      });
  }

  cambiarOrden(orden: OrdenPublicaciones): void {
    if (orden === this.orden()) return;
    this.orden.set(orden);
    this.pagina.set(1);
    this.cargar();
  }

  irAPagina(n: number): void {
    if (n < 1 || n > this.totalPaginas()) return;
    this.pagina.set(n);
    this.cargar();
  }

  elegirImagen(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    this.imagen = null;
    if (!archivo) return;

    // Misma regla que el back: solo imágenes y hasta 3MB
    if (!/^image\/(jpeg|png|webp|gif)$/.test(archivo.type)) {
      this.modal.error('Imagen no válida', ['El archivo debe ser una imagen JPG, PNG, WEBP o GIF.']);
      input.value = '';
      return;
    }
    if (archivo.size > 3 * 1024 * 1024) {
      this.modal.error('Imagen demasiado grande', ['La imagen no puede superar los 3MB.']);
      input.value = '';
      return;
    }
    this.imagen = archivo;
  }

  publicar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const datos = new FormData();
    datos.append('titulo', this.form.controls.titulo.value);
    datos.append('mensaje', this.form.controls.mensaje.value);
    if (this.imagen) datos.append('imagen', this.imagen);

    this.publicando.set(true);
    this.api.crear(datos).subscribe({
      next: () => {
        this.publicando.set(false);
        this.form.reset();
        this.imagen = null;
        // Volvemos a la primera página ordenada por fecha para ver la publicación nueva
        this.orden.set('fecha');
        this.pagina.set(1);
        this.cargar();
        this.modal.exito('Publicación creada', 'Tu publicación ya está visible.');
      },
      error: (e) => {
        this.publicando.set(false);
        this.modal.error('No se pudo publicar', mensajesDeError(e));
      },
    });
  }

  alternarLike(p: Publicacion): void {
    // Evita el doble click: mientras hay una petición en curso para esta publicación se ignora
    if (this.likesEnCurso.has(p.id)) return;
    this.likesEnCurso.add(p.id);

    const peticion = p.meGusta ? this.api.quitarLike(p.id) : this.api.darLike(p.id);
    peticion.pipe(finalize(() => this.likesEnCurso.delete(p.id))).subscribe({
      // El back devuelve la publicación actualizada: reemplazamos solo esa
      next: (actualizada) =>
        this.publicaciones.update((lista) => lista.map((x) => (x.id === p.id ? actualizada : x))),
      error: (e) => this.modal.error('No se pudo registrar el me gusta', mensajesDeError(e)),
    });
  }

  puedeEliminar(p: Publicacion): boolean {
    return this.auth.esAdmin() || p.usuario.id === this.auth.usuario()?.id;
  }

  async eliminar(p: Publicacion): Promise<void> {
    const confirmado = await this.modal.mostrar({
      titulo: 'Eliminar publicación',
      mensajes: [`¿Seguro que querés eliminar "${p.titulo}"?`],
      tipo: 'info',
      textoAceptar: 'Eliminar',
      textoCancelar: 'Cancelar',
    });
    if (!confirmado) return;

    this.api.eliminar(p.id).subscribe({
      next: () => {
        // Si era la última de la página, retrocedemos una
        if (this.publicaciones().length === 1 && this.pagina() > 1) this.pagina.update((n) => n - 1);
        this.cargar();
      },
      error: (e) => this.modal.error('No se pudo eliminar', mensajesDeError(e)),
    });
  }
}
