import { Component } from '@angular/core';
import { RecruiterLayout } from '@features/recruiter/layout/recruiter-layout';

@Component({
  selector: 'app-recruiter-main',
  standalone: true,
  imports: [RecruiterLayout],
  template: `<app-recruiter-layout />`,
})
export class RecruiterMain {}
