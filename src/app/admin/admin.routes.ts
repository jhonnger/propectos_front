import { Routes } from '@angular/router';
import { UploadExcelComponent } from './upload-excel/upload-excel.component';
import { AssignProspectsComponent } from './assign-prospects/assign-prospects.component';
// import { ReportsComponent } from './reports/reports.component';
// import { CreateUserComponent } from './create-user/create-user.component';
import {AdminComponent} from './admin/admin.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminComponent, // Componente principal de admin
    children: [
      { path: 'upload-excel', component: UploadExcelComponent },
      { path: 'assign-prospects', component: AssignProspectsComponent },
      // { path: 'reports', component: ReportsComponent },
      // { path: 'create-user', component: CreateUserComponent },
    ],
  },
];
