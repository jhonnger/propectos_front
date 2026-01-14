import { Routes } from '@angular/router';
import {UserComponent} from './user/user.component';
import {DashboardComponent} from './dashboard/dashboard.component';
// import { UserDashboardComponent } from './user-dashboard/user-dashboard.component';
// import { UserProfileComponent } from './user-profile/user-profile.component';

export const userRoutes: Routes = [
  {
    path: 'app',
    component: UserComponent, // Componente principal de user
    children: [
      { path: 'dashboard', component: DashboardComponent },
      // Agrega más rutas aquí
    ],
  },
];
