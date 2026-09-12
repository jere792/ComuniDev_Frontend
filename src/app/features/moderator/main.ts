import { Component } from '@angular/core';
import { ModeratorLayout } from './layout/moderator-layout';

@Component({
  selector: 'app-moderator-main',
  standalone: true,
  imports: [ModeratorLayout],
  template: `<app-moderator-layout />`,
})
export class ModeratorMain {}
