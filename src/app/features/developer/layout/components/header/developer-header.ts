import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificationBell } from '@features/shared/ui/notification-bell/notification-bell';

@Component({
  selector: 'app-developer-header',
  standalone: true,
  imports: [RouterLink, NotificationBell],
  templateUrl: './developer-header.html',
  styleUrl: './developer-header.scss',
})
export class DeveloperHeader {
  @Input() badgeText = '';
  @Input() badgeClass = '';
}
