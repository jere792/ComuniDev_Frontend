import { Component, OnInit } from '@angular/core';
import { RouterOutlet, ActivatedRoute } from '@angular/router';
import { ModeratorHeader } from './components/moderator-header/moderator-header';
import { ModeratorSidebar, SidebarLink } from './components/moderator-sidebar/moderator-sidebar';

@Component({
  selector: 'app-moderator-layout',
  imports: [RouterOutlet, ModeratorHeader, ModeratorSidebar],
  templateUrl: './moderator-layout.html',
  styleUrl: './moderator-layout.scss',
})
export class ModeratorLayout implements OnInit {
  sidebarLinks: SidebarLink[] = [];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const data = this.route.snapshot.data;
    this.sidebarLinks = data['sidebarLinks'] || [];
  }
}
