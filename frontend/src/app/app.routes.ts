import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'publicaciones' },
  {
    path: 'login',
    title: 'Ingresar · Forum',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'registro',
    title: 'Registro · Forum',
    loadComponent: () => import('./pages/registro/registro.component').then((m) => m.RegistroComponent),
  },
  {
    path: 'publicaciones',
    title: 'Publicaciones · Forum',
    loadComponent: () =>
      import('./pages/publicaciones/publicaciones.component').then((m) => m.PublicacionesComponent),
  },
  {
    path: 'mi-perfil',
    title: 'Mi perfil · Forum',
    loadComponent: () => import('./pages/mi-perfil/mi-perfil.component').then((m) => m.MiPerfilComponent),
  },
  { path: '**', redirectTo: 'publicaciones' },
];
