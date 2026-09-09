import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';

export interface SidebarLink {
  label: string;
  route: string;
  icon?: string;
}

@Component({
  selector: 'app-user-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './user-sidebar.html',
  styleUrl: './user-sidebar.scss',
})
export class UserSidebar {
  @Input() links: SidebarLink[] = [];

  constructor(private authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }
}
