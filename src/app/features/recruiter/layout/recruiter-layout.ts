import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, ActivatedRoute } from '@angular/router';
import { RecruiterSidebar } from '@features/recruiter/layout/components/sidebar/recruiter-sidebar';
import { RecruiterHeader, HeaderLink } from '@features/recruiter/layout/components/header/recruiter-header';

import { BottomNav } from '@shared/ui/bottom-nav/bottom-nav';

@Component({
  selector: 'app-recruiter-layout',
  standalone: true,
  imports: [BottomNav, RouterOutlet, RecruiterSidebar, RecruiterHeader],
  templateUrl: './recruiter-layout.html',
  styleUrl: './recruiter-layout.scss',
})
export class RecruiterLayout implements OnInit {
  private route = inject(ActivatedRoute);

  /** Links del header de escritorio: sin Mensajes (icono a la derecha) ni Perfil (sidebar). */
  headerLinks: HeaderLink[] = [];
  /** Links completos para el bottom-nav movil. */
  navLinks: HeaderLink[] = [];

  ngOnInit(): void {
    const data = this.route.snapshot.data;
    const sidebarLinks = data['sidebarLinks'] || [];
    this.navLinks = sidebarLinks.map((l: any) => ({ label: l.label, route: l.route, icon: l.icon }));
    this.headerLinks = this.navLinks.filter(
      (l) => !l.route.includes('/profile') && !l.route.includes('/messages'),
    );
  }
}
