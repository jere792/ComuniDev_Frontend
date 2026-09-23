import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, ActivatedRoute } from '@angular/router';
import { RecruiterSidebar } from '@features/recruiter/layout/components/sidebar/recruiter-sidebar';
import { RecruiterHeader, HeaderLink } from '@features/recruiter/layout/components/header/recruiter-header';

@Component({
  selector: 'app-recruiter-layout',
  standalone: true,
  imports: [RouterOutlet, RecruiterSidebar, RecruiterHeader],
  templateUrl: './recruiter-layout.html',
  styleUrl: './recruiter-layout.scss',
})
export class RecruiterLayout implements OnInit {
  private route = inject(ActivatedRoute);

  headerLinks: HeaderLink[] = [];

  ngOnInit(): void {
    const data = this.route.snapshot.data;
    const sidebarLinks = data['sidebarLinks'] || [];
    this.headerLinks = sidebarLinks.map((l: any) => ({ label: l.label, route: l.route, icon: l.icon }));
  }
}
