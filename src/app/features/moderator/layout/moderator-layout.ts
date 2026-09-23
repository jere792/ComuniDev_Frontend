import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, ActivatedRoute } from '@angular/router';
import { ModeratorHeader } from '@features/moderator/layout/components/header/moderator-header';
import { ModeratorSidebar, SidebarLink } from '@features/moderator/layout/components/sidebar/moderator-sidebar';

@Component({
  selector: 'app-moderator-layout',
  standalone: true,
  imports: [RouterOutlet, ModeratorHeader, ModeratorSidebar],
  templateUrl: './moderator-layout.html',
  styleUrl: './moderator-layout.scss',
})
export class ModeratorLayout implements OnInit {
  private route = inject(ActivatedRoute);

  sidebarLinks: SidebarLink[] = [];

  ngOnInit(): void {
    const data = this.route.snapshot.data;
    this.sidebarLinks = data['sidebarLinks'] || [];
  }
}
