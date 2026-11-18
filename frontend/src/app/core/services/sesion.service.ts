import { Injectable, effect, inject, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { ModalService } from '../../shared/modal/modal.service';
import { AuthService } from './auth.service';

const AVISO_ANTES_DE_VENCER_MS = 5 * 60 * 1000;

// Vigila el vencimiento del token (15 min). A los 10 min de haberlo recibido, o sea 5 antes de
// que venza, pregunta si se quiere extender la sesión. Se reprograma solo cada vez que cambia
// el token: al iniciar sesión, al refrescarlo y al cerrar sesión.
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly auth = inject(AuthService);
  private readonly modal = inject(ModalService);
  private readonly router = inject(Router);

  private temporizadorAviso?: ReturnType<typeof setTimeout>;
  private temporizadorExpira?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const token = this.auth.token();
      untracked(() => this.programar(token));
    });
  }

  private programar(token: string | null): void {
    clearTimeout(this.temporizadorAviso);
    clearTimeout(this.temporizadorExpira);
    if (!token) return;

    const vence = this.vencimiento(token);
    const restante = vence - Date.now();
    // Si ya venció, no se programa nada: la pantalla de carga o el interceptor 401 se encargan
    if (!vence || restante <= 0) return;

    this.temporizadorAviso = setTimeout(
      () => void this.avisar(token),
      Math.max(0, restante - AVISO_ANTES_DE_VENCER_MS),
    );
    this.temporizadorExpira = setTimeout(() => this.expirar(token), restante);
  }

  private async avisar(token: string): Promise<void> {
    const extender = await this.modal.mostrar({
      titulo: 'Tu sesión está por vencer',
      mensajes: ['Quedan 5 minutos de sesión.', '¿Querés extenderla?'],
      textoAceptar: 'Extender sesión',
      textoCancelar: 'No, gracias',
    });
    // Si mientras tanto cerró sesión o el token cambió, no hay nada que extender
    if (!extender || this.auth.token() !== token) return;
    this.auth.refrescar().subscribe({ error: () => this.expirar(token) });
  }

  private expirar(token: string): void {
    if (this.auth.token() !== token) return;
    this.modal.cerrar(false); // por si el aviso seguía abierto
    this.auth.logout();
    this.router.navigate(['/login']);
    this.modal.error('Tu sesión expiró', ['Volvé a iniciar sesión para continuar.']);
  }

  // Lee el campo "exp" (segundos) del payload del JWT y lo devuelve en milisegundos
  private vencimiento(token: string): number {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.exp === 'number' ? payload.exp * 1000 : 0;
    } catch {
      return 0;
    }
  }
}
