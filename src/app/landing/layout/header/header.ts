import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';
import { LanguageService } from '../../../core/services/language.service';
import { TranslationPipe } from '../../../core/pipes/translation.pipe';

@Component({
  selector: 'app-layout-header',
  imports: [RouterLink, RouterLinkActive, TranslationPipe],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class LayoutHeader {
  theme = inject(ThemeService);
  language = inject(LanguageService);
  menuOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }
}
