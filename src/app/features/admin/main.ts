import { Component } from '@angular/core';
import { AdminLayout } from '@features/admin/layout/admin-layout';

@Component({
  selector: 'app-admin-main',
  standalone: true,
  imports: [AdminLayout],
  template: `<app-admin-layout />`,
})
export class AdminMain {}
