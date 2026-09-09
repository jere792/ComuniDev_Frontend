import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { UserSidebar, SidebarLink } from './components/user-sidebar/user-sidebar';
import { UserRightPanel } from './components/user-right-panel/user-right-panel';

@Component({
  selector: 'app-user-layout',
  imports: [RouterOutlet, UserSidebar, UserRightPanel],
  templateUrl: './user-layout.html',
  styleUrl: './user-layout.scss',
})
export class UserLayout implements OnInit {
  sidebarLinks: SidebarLink[] = [];
  showRightPanel = true;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const data = this.route.snapshot.data;
    this.sidebarLinks = data['sidebarLinks'] || [];

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const navEnd = event as NavigationEnd;
      this.showRightPanel = !navEnd.urlAfterRedirects.includes('/profile');
    });
  }
}
