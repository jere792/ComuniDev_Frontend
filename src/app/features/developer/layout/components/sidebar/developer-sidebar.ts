import { Component, Input, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '@features/auth/data-access/state/auth.store';

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
  private authStore = inject(AuthStore);

  @Input() links: SidebarLink[] = [];

  logout(): void {
    this.authStore.logout();
  }
}
