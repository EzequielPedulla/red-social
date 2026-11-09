import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { mensajesDeError } from '../../core/utils/errores';
import { ModalService } from '../../shared/modal/modal.service';
import { REGEX_PASSWORD } from '../login/login.component';

const MAX_IMAGEN = 3 * 1024 * 1024;

const passwordsIguales: ValidatorFn = (g: AbstractControl): ValidationErrors | null => {
  const p = g.get('password')?.value;
  const r = g.get('repetirPassword')?.value;
  return p && r && p !== r ? { noCoinciden: true } : null;
};

const noFutura: ValidatorFn = (c: AbstractControl): ValidationErrors | null =>
  c.value && new Date(c.value) > new Date() ? { futura: true } : null;

type Campo =
  | 'nombre' | 'apellido' | 'correo' | 'nombreUsuario' | 'password'
  | 'repetirPassword' | 'fechaNacimiento' | 'descripcion';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.scss',
})
export class RegistroComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly modal = inject(ModalService);
  private readonly router = inject(Router);

  readonly enviando = signal(false);
  readonly errorImagen = signal<string | null>(null);
  readonly vistaPrevia = signal<string | null>(null);
  readonly hoy = new Date().toISOString().split('T')[0];
  private imagen: File | null = null;

  readonly form = this.fb.nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(50)]],
      apellido: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(50)]],
      correo: ['', [Validators.required, Validators.email]],
      nombreUsuario: ['', [
        Validators.required, Validators.minLength(3), Validators.maxLength(30),
        Validators.pattern(/^[a-zA-Z0-9_.]+$/),
      ]],
      password: ['', [Validators.required, Validators.pattern(REGEX_PASSWORD)]],
      repetirPassword: ['', [Validators.required]],
      fechaNacimiento: ['', [Validators.required, noFutura]],
      descripcion: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(200)]],
    },
    { validators: passwordsIguales },
  );

  mostrarError(campo: Campo): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  // Mensaje acorde al error que corresponda al campo
  mensaje(campo: Campo): string {
    const e = this.form.controls[campo].errors ?? {};
    if (e['required'] || e['pattern'] && ['nombre', 'apellido', 'descripcion'].includes(campo)) {
      return 'Este campo es obligatorio.';
    }
    switch (campo) {
      case 'correo': return 'Ingresá un correo válido.';
      case 'nombreUsuario':
        return e['pattern']
          ? 'Solo letras, números, guion bajo y punto.'
          : 'Debe tener entre 3 y 30 caracteres.';
      case 'password': return 'Debe tener al menos 8 caracteres, una mayúscula y un número.';
      case 'fechaNacimiento': return 'La fecha no puede ser futura.';
      case 'descripcion': return 'Máximo 200 caracteres.';
      default: return 'El valor ingresado no es válido.';
    }
  }

  get noCoinciden(): boolean {
    return this.form.hasError('noCoinciden') && this.form.controls.repetirPassword.dirty;
  }

  alElegirImagen(evento: Event): void {
    const archivo = (evento.target as HTMLInputElement).files?.[0] ?? null;
    this.errorImagen.set(null);
    this.imagen = null;
    this.vistaPrevia.set(null);
    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
      this.errorImagen.set('El archivo debe ser una imagen.');
    } else if (archivo.size > MAX_IMAGEN) {
      this.errorImagen.set('La imagen no puede superar los 3 MB.');
    } else {
      this.imagen = archivo;
      this.vistaPrevia.set(URL.createObjectURL(archivo));
    }
  }

  enviar(): void {
    if (this.form.invalid || this.errorImagen()) {
      this.form.markAllAsTouched();
      return;
    }
    const datos = new FormData();
    Object.entries(this.form.getRawValue()).forEach(([k, v]) => datos.append(k, v));
    if (this.imagen) datos.append('imagen', this.imagen);

    this.enviando.set(true);
    this.auth.registro(datos).subscribe({
      next: async () => {
        await this.modal.exito('¡Cuenta creada!', 'Tu registro se completó correctamente.');
        this.router.navigate(['/publicaciones']);
      },
      error: (err) => {
        this.enviando.set(false);
        this.modal.error('No pudimos completar el registro', mensajesDeError(err));
      },
    });
  }
}
