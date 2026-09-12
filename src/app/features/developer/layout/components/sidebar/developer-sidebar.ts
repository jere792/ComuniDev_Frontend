import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../../../auth/data-access/state/auth.store';

export interface SidebarLink {
  label: string;
  route: string;
  icon?: string;
}

@Component({
  selector: 'app-developer-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './developer-sidebar.html',
  styleUrl: './developer-sidebar.scss',
})
export class DeveloperSidebar {
  @Input() links: SidebarLink[] = [];

  constructor(private authStore: AuthStore) {}

  logout(): void {
    this.authStore.logout();
  }
}
