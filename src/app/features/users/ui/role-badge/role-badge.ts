import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-role-badge',
  standalone: true,
  templateUrl: './role-badge.html',
  styleUrl: './role-badge.scss',
})
export class RoleBadge {
  @Input() role = '';
}
