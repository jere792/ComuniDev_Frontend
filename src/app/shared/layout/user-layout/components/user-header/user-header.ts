import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-user-header',
  templateUrl: './user-header.html',
  styleUrl: './user-header.scss',
})
export class UserHeader {
  @Input() badgeText = '';
  @Input() badgeClass = '';
}
