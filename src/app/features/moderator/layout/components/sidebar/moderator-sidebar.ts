import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../../../auth/data-access/state/auth.store';

export interface SidebarLink {
  label: string;
  route: string;
  icon?: string;
}

@Component({
  selector: 'app-moderator-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './moderator-sidebar.html',
  styleUrl: './moderator-sidebar.scss',
})
export class ModeratorSidebar {
  @Input() links: SidebarLink[] = [];

  constructor(private authStore: AuthStore) {}

  logout(): void {
    this.authStore.logout();
  }
}
