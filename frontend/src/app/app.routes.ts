import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Cargando · Forum',
    loadComponent: () => import('./pages/cargando/cargando.component').then((m) => m.CargandoComponent),
  },
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
    path: 'publicaciones/:id',
    title: 'Publicación · Forum',
    loadComponent: () => import('./pages/publicacion/publicacion.component').then((m) => m.PublicacionComponent),
  },
  {
    path: 'mi-perfil',
    title: 'Mi perfil · Forum',
    loadComponent: () => import('./pages/mi-perfil/mi-perfil.component').then((m) => m.MiPerfilComponent),
  },
  {
    path: 'mi-perfil/editar',
    title: 'Editar perfil · Forum',
    loadComponent: () =>
      import('./pages/editar-perfil/editar-perfil.component').then((m) => m.EditarPerfilComponent),
  },
  { path: '**', redirectTo: 'publicaciones' },
];
