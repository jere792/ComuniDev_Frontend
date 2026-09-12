import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar-card.html',
  styleUrl: './sidebar-card.scss',
})
export class SidebarCard {
  @Input() icon = '';
  @Input() title = '';
  @Input() subtitle = '';
}
