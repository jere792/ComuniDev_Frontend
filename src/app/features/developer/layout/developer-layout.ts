import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet, ActivatedRoute } from '@angular/router';
import { DeveloperSidebar, SidebarLink } from '@features/developer/layout/components/sidebar/developer-sidebar';

@Component({
  selector: 'app-developer-layout',
  standalone: true,
  imports: [RouterOutlet, DeveloperSidebar],
  templateUrl: './developer-layout.html',
  styleUrl: './developer-layout.scss',
})
export class DeveloperLayout implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  sidebarLinks: SidebarLink[] = [];

  ngOnInit(): void {
    const data = this.route.snapshot.data;
    this.sidebarLinks = data['sidebarLinks'] || [];
  }
}
