import { Component } from '@angular/core';
import { UserLayout } from '../shared/layout/user-layout/user-layout';

@Component({
  selector: 'app-recruiter',
  imports: [UserLayout],
  template: `<app-user-layout />`,
})
export class Recruiter {}
