import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin-header',
  imports: [],
  templateUrl: './admin-header.html',
  styleUrl: './admin-header.scss',
})
export class AdminHeader {
  @Input() badgeText = 'Admin';
  @Input() badgeClass = 'badge-admin';
}
