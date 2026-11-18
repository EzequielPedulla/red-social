import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { mensajesDeError } from '../../core/utils/errores';
import { ContadorComponent } from '../../shared/contador/contador.component';
import { ModalService } from '../../shared/modal/modal.service';

const MAX_IMAGEN = 3 * 1024 * 1024;

@Component({
  selector: 'app-editar-perfil',
  imports: [ReactiveFormsModule, RouterLink, ContadorComponent],
  templateUrl: './editar-perfil.component.html',
  styleUrl: '../registro/registro.component.scss',
})
export class EditarPerfilComponent {
  private readonly fb = inject(FormBuilder);
  private readonly modal = inject(ModalService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly enviando = signal(false);
  readonly errorImagen = signal<string | null>(null);
  readonly vistaPrevia = signal<string | null>(null);
  readonly hoy = new Date().toISOString().split('T')[0];
  private imagen: File | null = null;

  private readonly u = this.auth.usuario();

  readonly form = this.fb.nonNullable.group({
    nombre: [this.u?.nombre ?? '', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(50)]],
    apellido: [this.u?.apellido ?? '', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(50)]],
    nombreUsuario: [this.u?.nombreUsuario ?? '', [
      Validators.required, Validators.minLength(3), Validators.maxLength(30),
      Validators.pattern(/^[a-zA-Z0-9_.]+$/),
    ]],
    fechaNacimiento: [(this.u?.fechaNacimiento ?? '').slice(0, 10), [Validators.required]],
    descripcion: [this.u?.descripcion ?? '', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(200)]],
  });

  invalido(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  alElegirImagen(evento: Event): void {
    const archivo = (evento.target as HTMLInputElement).files?.[0] ?? null;
    this.errorImagen.set(null);
    this.imagen = null;
    this.vistaPrevia.set(null);
    if (!archivo) return;

    if (!/^image\/(jpeg|png|webp|gif)$/.test(archivo.type)) {
      this.errorImagen.set('La imagen debe ser JPG, PNG, WEBP o GIF.');
    } else if (archivo.size > MAX_IMAGEN) {
      this.errorImagen.set('La imagen no puede superar los 3 MB.');
    } else {
      this.imagen = archivo;
      this.vistaPrevia.set(URL.createObjectURL(archivo));
    }
  }

  guardar(): void {
    if (this.form.invalid || this.errorImagen()) {
      this.form.markAllAsTouched();
      return;
    }
    const datos = new FormData();
    Object.entries(this.form.getRawValue()).forEach(([k, v]) => datos.append(k, v));
    if (this.imagen) datos.append('imagen', this.imagen);

    this.enviando.set(true);
    this.auth.actualizarPerfil(datos).subscribe({
      next: async () => {
        await this.modal.exito('Perfil actualizado', 'Tus datos se guardaron correctamente.');
        this.router.navigate(['/mi-perfil']);
      },
      error: (e) => {
        this.enviando.set(false);
        this.modal.error('No se pudo actualizar el perfil', mensajesDeError(e));
      },
    });
  }
}
