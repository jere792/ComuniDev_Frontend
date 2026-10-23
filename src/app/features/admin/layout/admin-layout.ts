import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, ActivatedRoute } from '@angular/router';
import { AdminHeader } from '@features/admin/layout/components/header/admin-header';
import { AdminSidebar, SidebarLink } from '@features/admin/layout/components/sidebar/admin-sidebar';

import { BottomNav } from '@shared/ui/bottom-nav/bottom-nav';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [BottomNav, RouterOutlet, AdminHeader, AdminSidebar],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout implements OnInit {
  private route = inject(ActivatedRoute);

  sidebarLinks: SidebarLink[] = [];

  ngOnInit(): void {
    const data = this.route.snapshot.data;
    this.sidebarLinks = data['sidebarLinks'] || [];
  }
}
