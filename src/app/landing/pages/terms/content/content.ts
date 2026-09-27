import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { TranslationPipe } from '@core/pipes/translation.pipe';

@Component({
  selector: 'app-terms-content',
  imports: [TranslationPipe],
  templateUrl: './content.html',
  styleUrl: './content.scss',
})
export class TermsContent implements AfterViewInit, OnDestroy {
  sections = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  activeSection = 1;
  private observer?: IntersectionObserver;

  goTo(n: number): void {
    this.activeSection = n;
    document
      .getElementById(`terms-section-${n}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined') return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const n = Number(entry.target.id.split('-').pop());
            if (n) this.activeSection = n;
          }
        });
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
    );

    this.sections.forEach((n) => {
      const el = document.getElementById(`terms-section-${n}`);
      if (el) this.observer?.observe(el);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
