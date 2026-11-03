import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, ActivatedRoute } from '@angular/router';
import { DeveloperSidebar } from '@features/developer/layout/components/sidebar/developer-sidebar';
import { DeveloperHeader, HeaderLink } from '@features/developer/layout/components/header/developer-header';

import { BottomNav } from '@shared/ui/bottom-nav/bottom-nav';

@Component({
  selector: 'app-developer-layout',
  standalone: true,
  imports: [BottomNav, RouterOutlet, DeveloperSidebar, DeveloperHeader],
  templateUrl: './developer-layout.html',
  styleUrl: './developer-layout.scss',
})
export class DeveloperLayout implements OnInit {
  private route = inject(ActivatedRoute);

  /** Links del header de escritorio: sin "Perfil" (ya vive en el sidebar). */
  headerLinks: HeaderLink[] = [];
  /** Links completos para el bottom-nav movil (ahi si incluye Perfil). */
  navLinks: HeaderLink[] = [];

  ngOnInit(): void {
    const data = this.route.snapshot.data;
    const links = data['sidebarLinks'] || [];
    this.navLinks = links.map((l: { label: string; route: string; icon?: string }) => ({
      label: l.label,
      route: l.route,
      icon: l.icon,
    }));
    this.headerLinks = this.navLinks.filter((l) => !l.route.includes('/profile'));
  }
}
