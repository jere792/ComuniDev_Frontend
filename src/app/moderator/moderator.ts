import { Component } from '@angular/core';
import { ModeratorLayout } from '../shared/layout/moderator-layout/moderator-layout';

@Component({
  selector: 'app-moderator',
  imports: [ModeratorLayout],
  template: `<app-moderator-layout />`,
})
export class Moderator {}
