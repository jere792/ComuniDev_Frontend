import { Component, Input, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '@features/auth/data-access/state/auth.store';

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
  private authStore = inject(AuthStore);

  @Input() links: SidebarLink[] = [];

  logout(): void {
    this.authStore.logout();
  }
}
