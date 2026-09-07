import { Component, input } from '@angular/core';

export interface HeroInfoItem {
  icon: string;
  text: string;
}

@Component({
  selector: 'app-page-hero',
  templateUrl: './page-hero.html',
  styleUrl: './page-hero.scss',
})
export class PageHero {
  badge = input<string>('');
  title = input<string>('');
  subtitle = input<string>('');
  info = input<HeroInfoItem[]>([]);
}
