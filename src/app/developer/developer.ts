import { Component } from '@angular/core';
import { UserLayout } from '../shared/layout/user-layout/user-layout';

@Component({
  selector: 'app-developer',
  imports: [UserLayout],
  template: `<app-user-layout />`,
})
export class Developer {}
