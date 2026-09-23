import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, ActivatedRoute } from '@angular/router';
import { AdminHeader } from '@features/admin/layout/components/header/admin-header';
import { AdminSidebar, SidebarLink } from '@features/admin/layout/components/sidebar/admin-sidebar';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, AdminHeader, AdminSidebar],
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
