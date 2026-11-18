import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SesionService } from './core/services/sesion.service';
import { ModalComponent } from './shared/modal/modal.component';
import { NavbarComponent } from './shared/navbar/navbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, ModalComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  // Solo se inyecta para que arranque el control de vencimiento de la sesión
  private readonly sesion = inject(SesionService);
}
