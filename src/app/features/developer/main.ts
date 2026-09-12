import { Component } from '@angular/core';
import { DeveloperLayout } from './layout/developer-layout';

@Component({
  selector: 'app-developer-main',
  standalone: true,
  imports: [DeveloperLayout],
  template: `<app-developer-layout />`,
})
export class DeveloperMain {}
