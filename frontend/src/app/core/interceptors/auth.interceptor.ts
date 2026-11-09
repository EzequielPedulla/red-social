import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, catchError, throwError } from 'rxjs';
import { ModalService } from '../../shared/modal/modal.service';
import { AuthService } from '../services/auth.service';

// 1) Agrega el JWT a cada petición saliente.
// 2) Si el servidor responde 401 con una sesión abierta (token vencido o inválido),
//    cierra la sesión y manda al login. Las rutas /auth/ se excluyen porque ahí un 401
//    significa "credenciales incorrectas" y lo muestra el propio formulario.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const modal = inject(ModalService);
  const token = auth.token();

  const peticion = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(peticion).pipe(
    catchError((err) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && token && !req.url.includes('/auth/')) {
        auth.logout();
        router.navigate(['/login']);
        modal.error('Tu sesión expiró', ['Volvé a iniciar sesión para continuar.']);
        // EMPTY: la petición termina sin error, así el componente no abre otro modal encima
        return EMPTY;
      }
      return throwError(() => err);
    }),
  );
};
