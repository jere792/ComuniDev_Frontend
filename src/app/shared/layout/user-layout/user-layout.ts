import { Component, OnInit } from '@angular/core';
import { RouterOutlet, ActivatedRoute } from '@angular/router';
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

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const data = this.route.snapshot.data;
    this.sidebarLinks = data['sidebarLinks'] || [];
  }
}
