import { Directive, ElementRef, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

@Directive({ selector: '[appReveal]', standalone: true })
export class RevealDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef);
  private router = inject(Router);
  private observer?: IntersectionObserver;
  private sub?: ReturnType<typeof Router.prototype.events.subscribe>;

  ngAfterViewInit(): void {
    this.initObserver();
    this.sub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        setTimeout(() => this.reinit(), 50);
      });
  }

  private initObserver(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.revealAll();
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
            setTimeout(() => el.classList.add('is-visible'), delay);
            this.observer?.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );

    const container = this.el.nativeElement;
    const stagger = container.getAttribute('data-reveal-stagger');

    if (stagger) {
      const children = container.querySelectorAll('[data-reveal]');
      children.forEach((child: Element, i: number) => {
        child.setAttribute('data-reveal-delay', String(i * parseInt(stagger, 10)));
        this.observer?.observe(child);
      });
    }

    this.observer.observe(container);
  }

  private reinit(): void {
    this.observer?.disconnect();
    const container = this.el.nativeElement;
    container.classList.remove('is-visible');
    const children = container.querySelectorAll('.is-visible');
    children.forEach((child: Element) => child.classList.remove('is-visible'));
    this.initObserver();
  }

  private revealAll(): void {
    this.el.nativeElement.classList.add('is-visible');
    this.el.nativeElement.querySelectorAll('[data-reveal]').forEach((el: Element) => {
      el.classList.add('is-visible');
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.sub?.unsubscribe();
  }
}
