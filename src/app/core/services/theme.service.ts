import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  dark = signal(false);

  toggle(): void {
    this.dark.update(v => !v);
    document.documentElement.classList.toggle('dark', this.dark());
  }
}
