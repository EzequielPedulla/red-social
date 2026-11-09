import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'publicaciones' },
  {
    path: 'login',
    title: 'Ingresar · Conecta',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'registro',
    title: 'Registro · Conecta',
    loadComponent: () => import('./pages/registro/registro.component').then((m) => m.RegistroComponent),
  },
  {
    path: 'publicaciones',
    title: 'Publicaciones · Conecta',
    loadComponent: () =>
      import('./pages/publicaciones/publicaciones.component').then((m) => m.PublicacionesComponent),
  },
  {
    path: 'mi-perfil',
    title: 'Mi perfil · Conecta',
    loadComponent: () => import('./pages/mi-perfil/mi-perfil.component').then((m) => m.MiPerfilComponent),
  },
  { path: '**', redirectTo: 'publicaciones' },
];
