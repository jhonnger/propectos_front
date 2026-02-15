import { Routes } from '@angular/router';
import { UploadExcelComponent } from './upload-excel/upload-excel.component';
import { AssignProspectsComponent } from './assign-prospects/assign-prospects.component';
import { ManageUsersComponent } from './manage-users/manage-users.component';
// import { ReportsComponent } from './reports/reports.component';
import {AdminComponent} from './admin/admin.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      { path: 'upload-excel', component: UploadExcelComponent },
      { path: 'assign-prospects', component: AssignProspectsComponent },
      { path: 'manage-users', component: ManageUsersComponent },
      // { path: 'reports', component: ReportsComponent },
    ],
  },
];
