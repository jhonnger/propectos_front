import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { authGuard } from './auth/auth.guard';
import { adminGuard } from './auth/admin.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  // Rutas para admin — requiere autenticacion y rol ADMINISTRADOR
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes),
  },
  // Rutas para user — requiere autenticacion
  {
    path: 'user',
    canActivate: [authGuard],
    loadChildren: () => import('./user/user.routes').then(m => m.userRoutes),
  },
  // Redirección por defecto: va a /login y el guard resuelve según el token/rol
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  // Ruta para 404
  { path: '**', redirectTo: '/login' },
];
