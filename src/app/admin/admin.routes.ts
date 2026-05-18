import { Routes } from '@angular/router';
import { UploadExcelComponent } from './upload-excel/upload-excel.component';
import { AssignProspectsComponent } from './assign-prospects/assign-prospects.component';
import { ManageUsersComponent } from './manage-users/manage-users.component';
import { DashboardAdminComponent } from './dashboard-admin/dashboard-admin.component';
import { AdminComponent } from './admin/admin.component';
import { PorCerrarComponent } from './por-cerrar/por-cerrar.component';
import { ConfiguracionComponent } from './configuracion/configuracion.component';
import { CalendarioComponent } from './calendario/calendario.component';
import { ReasignacionComponent } from './reasignacion/reasignacion.component';
import { BitacoraComponent } from './bitacora/bitacora.component';

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
      { path: 'configuracion', component: ConfiguracionComponent },
      { path: 'calendario', component: CalendarioComponent },
      { path: 'reasignacion', component: ReasignacionComponent },
      { path: 'bitacora', component: BitacoraComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
