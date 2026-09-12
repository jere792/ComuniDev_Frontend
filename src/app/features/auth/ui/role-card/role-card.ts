import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-role-card',
  standalone: true,
  templateUrl: './role-card.html',
  styleUrl: './role-card.scss',
})
export class RoleCard {
  @Input() icon = '';
  @Input() title = '';
  @Input() description = '';
  @Output() select = new EventEmitter<void>();
}
