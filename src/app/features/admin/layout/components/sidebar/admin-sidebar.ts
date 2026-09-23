import { Component, Input, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '@features/auth/data-access/state/auth.store';

export interface SidebarLink {
  label: string;
  route: string;
  icon?: string;
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.scss',
})
export class AdminSidebar {
  private authStore = inject(AuthStore);

  @Input() links: SidebarLink[] = [];

  logout(): void {
    this.authStore.logout();
  }
}
