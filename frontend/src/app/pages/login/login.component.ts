import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { mensajesDeError } from '../../core/utils/errores';
import { ModalService } from '../../shared/modal/modal.service';

// Misma regla que el backend: 8+ caracteres, una mayúscula y un número
export const REGEX_PASSWORD = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly modal = inject(ModalService);
  private readonly router = inject(Router);

  readonly enviando = signal(false);
  readonly verPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    identificador: ['', [Validators.required, Validators.pattern(/\S/)]],
    password: ['', [Validators.required, Validators.pattern(REGEX_PASSWORD)]],
  });

  mostrarError(campo: 'identificador' | 'password'): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/publicaciones']),
      error: (err) => {
        this.enviando.set(false);
        this.modal.error('No pudimos iniciar sesión', mensajesDeError(err));
      },
    });
  }
}
