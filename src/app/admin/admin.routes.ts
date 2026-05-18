import { Routes } from '@angular/router';
import { UploadExcelComponent } from './upload-excel/upload-excel.component';
import { AssignProspectsComponent } from './assign-prospects/assign-prospects.component';
import { ManageUsersComponent } from './manage-users/manage-users.component';
import { DashboardAdminComponent } from './dashboard-admin/dashboard-admin.component';
import { AdminComponent } from './admin/admin.component';
import { PorCerrarComponent } from './por-cerrar/por-cerrar.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      { path: 'dashboard', component: DashboardAdminComponent },
      { path: 'upload-excel', component: UploadExcelComponent },
      { path: 'assign-prospects', component: AssignProspectsComponent },
      { path: 'manage-users', component: ManageUsersComponent },
      { path: 'por-cerrar', component: PorCerrarComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
