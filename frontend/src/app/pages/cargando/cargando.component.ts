import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

// Pantalla inicial: valida el token guardado contra /auth/autorizar.
// Válido -> publicaciones. Inválido, vencido o inexistente -> login.
@Component({
  selector: 'app-cargando',
  template: `
    <div class="cargando d-flex flex-column align-items-center justify-content-center text-center">
      <img src="logo-192.png" alt="Forum" width="72" height="72" class="mb-4" />
      <div class="spinner-border text-light" role="status" aria-hidden="true"></div>
      <p class="text-muted mt-3 mb-0">Cargando...</p>
    </div>
  `,
  styles: `
    .cargando { min-height: 70vh; }
  `,
})
export class CargandoComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    if (!this.auth.token()) {
      this.router.navigate(['/login'], { replaceUrl: true });
      return;
    }
    this.auth.autorizar().subscribe({
      next: () => this.router.navigate(['/publicaciones'], { replaceUrl: true }),
      error: () => {
        this.auth.logout();
        this.router.navigate(['/login'], { replaceUrl: true });
      },
    });
  }
}
