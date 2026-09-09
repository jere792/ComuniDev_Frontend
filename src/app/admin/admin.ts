import { Component } from '@angular/core';
import { AdminLayout } from '../shared/layout/admin-layout/admin-layout';

@Component({
  selector: 'app-admin',
  imports: [AdminLayout],
  template: `<app-admin-layout />`,
})
export class Admin {}
