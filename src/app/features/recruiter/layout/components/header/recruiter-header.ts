import { Component, Input, AfterViewInit, QueryList, ViewChildren, ElementRef, ChangeDetectorRef } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { NotificationBell } from '../../../../shared/ui/notification-bell/notification-bell';
import { filter } from 'rxjs';

export interface HeaderLink {
  label: string;
  route: string;
  icon?: string;
}

@Component({
  selector: 'app-recruiter-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NotificationBell],
  templateUrl: './recruiter-header.html',
  styleUrl: './recruiter-header.scss',
})
export class RecruiterHeader implements AfterViewInit {
  @Input() links: HeaderLink[] = [];
  @ViewChildren('tabEl') tabElements!: QueryList<ElementRef<HTMLElement>>;

  indicatorLeft = 0;
  indicatorWidth = 0;
  showIndicator = false;

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.updateIndicator();
    });
    setTimeout(() => this.updateIndicator(), 0);
  }

  updateIndicator(): void {
    const tabs = this.tabElements;
    if (!tabs || tabs.length === 0) return;

    const activeIndex = this.links.findIndex(l =>
      this.router.url.includes(l.route)
    );

    if (activeIndex >= 0 && tabs.get(activeIndex)) {
      const el = tabs.get(activeIndex)!.nativeElement;
      this.indicatorLeft = el.offsetLeft;
      this.indicatorWidth = el.offsetWidth;
      this.showIndicator = true;
    } else {
      this.showIndicator = false;
    }
    this.cdr.detectChanges();
  }

  onTabClick(index: number): void {
    const tabs = this.tabElements;
    if (!tabs) return;
    const el = tabs.get(index)?.nativeElement;
    if (el) {
      this.indicatorLeft = el.offsetLeft;
      this.indicatorWidth = el.offsetWidth;
    }
  }
}
