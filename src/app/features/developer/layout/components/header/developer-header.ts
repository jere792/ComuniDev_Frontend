import { Component, Input, OnInit, AfterViewInit, QueryList, ViewChildren, ElementRef, ChangeDetectorRef, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { NotificationBell } from '@features/shared/ui/notification-bell/notification-bell';
import { MessageStore } from '@features/shared/data-access/state/message.store';
import { filter } from 'rxjs';

export interface HeaderLink {
  label: string;
  route: string;
  icon?: string;
}

@Component({
  selector: 'app-developer-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NotificationBell],
  templateUrl: './developer-header.html',
  styleUrl: './developer-header.scss',
})
export class DeveloperHeader implements OnInit, AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private messageStore = inject(MessageStore);

  /** No leidos globales: badge del icono de Mensajes. */
  readonly noLeidos = this.messageStore.noLeidos;

  @Input() links: HeaderLink[] = [];
  @ViewChildren('tabEl') tabElements!: QueryList<ElementRef<HTMLElement>>;

  indicatorLeft = 0;
  indicatorWidth = 0;
  showIndicator = false;

  ngOnInit(): void {
    const userId = localStorage.getItem('userId');
    // Deja el canal de tiempo real activo en todo el layout, no solo en /messages.
    if (userId) this.messageStore.activar(userId);
  }

  ngAfterViewInit(): void {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.updateIndicator();
    });
    setTimeout(() => this.updateIndicator(), 0);
  }

  updateIndicator(): void {
    const tabs = this.tabElements;
    if (!tabs || tabs.length === 0) return;

    const activeIndex = this.links.findIndex(l => this.router.url.includes(l.route));

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
