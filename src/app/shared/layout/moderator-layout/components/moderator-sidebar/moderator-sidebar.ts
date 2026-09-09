import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';

export interface SidebarLink {
  label: string;
  route: string;
  icon?: string;
}

@Component({
  selector: 'app-moderator-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './moderator-sidebar.html',
  styleUrl: './moderator-sidebar.scss',
})
export class ModeratorSidebar {
  @Input() links: SidebarLink[] = [];

  constructor(private authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }
}
