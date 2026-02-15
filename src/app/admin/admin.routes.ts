import { Routes } from '@angular/router';
import { UploadExcelComponent } from './upload-excel/upload-excel.component';
import { AssignProspectsComponent } from './assign-prospects/assign-prospects.component';
import { UserFormComponent } from './user-form/user-form.component';
import { UsersListComponent } from './users-list/users-list.component';
// import { ReportsComponent } from './reports/reports.component';
import {AdminComponent} from './admin/admin.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminComponent, // Componente principal de admin
    children: [
      { path: 'upload-excel', component: UploadExcelComponent },
      { path: 'assign-prospects', component: AssignProspectsComponent },
      { path: 'users', component: UsersListComponent },
      { path: 'users/new', component: UserFormComponent },
      { path: 'users/:id/edit', component: UserFormComponent },
      // { path: 'create-user', component: CreateUserComponent }, // Ruta legacy comentada
      // { path: 'reports', component: ReportsComponent },
    ],
  },
];
