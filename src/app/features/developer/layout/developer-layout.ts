import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, ActivatedRoute } from '@angular/router';
import { DeveloperSidebar, SidebarLink } from './components/sidebar/developer-sidebar';

@Component({
  selector: 'app-developer-layout',
  standalone: true,
  imports: [RouterOutlet, DeveloperSidebar],
  templateUrl: './developer-layout.html',
  styleUrl: './developer-layout.scss',
})
export class DeveloperLayout implements OnInit {
  sidebarLinks: SidebarLink[] = [];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const data = this.route.snapshot.data;
    this.sidebarLinks = data['sidebarLinks'] || [];
  }
}
