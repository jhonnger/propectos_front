import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { DashboardComponent } from './user/dashboard/dashboard.component';
import { authGuard } from './auth/auth.guard';
import {UploadExcelComponent} from './admin/upload-excel/upload-excel.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  // Rutas para admin
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes),
  },
  // Rutas para user
  {
    path: 'user',
    loadChildren: () => import('./user/user.routes').then(m => m.userRoutes),
  },
  // Redirección por defecto
  { path: '', redirectTo: '/user/dashboard', pathMatch: 'full' },
  // Ruta para 404
  { path: '**', redirectTo: '/login' },
];
