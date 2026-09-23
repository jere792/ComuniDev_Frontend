import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, ActivatedRoute } from '@angular/router';
import { DeveloperSidebar } from '@features/developer/layout/components/sidebar/developer-sidebar';
import { DeveloperHeader, HeaderLink } from '@features/developer/layout/components/header/developer-header';

@Component({
  selector: 'app-developer-layout',
  standalone: true,
  imports: [RouterOutlet, DeveloperSidebar, DeveloperHeader],
  templateUrl: './developer-layout.html',
  styleUrl: './developer-layout.scss',
})
export class DeveloperLayout implements OnInit {
  private route = inject(ActivatedRoute);

  headerLinks: HeaderLink[] = [];

  ngOnInit(): void {
    const data = this.route.snapshot.data;
    const links = data['sidebarLinks'] || [];
    this.headerLinks = links.map((l: { label: string; route: string; icon?: string }) => ({
      label: l.label,
      route: l.route,
      icon: l.icon,
    }));
  }
}
