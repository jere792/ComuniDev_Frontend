import { Component } from '@angular/core';
import { PageHero } from '@shared/components/page-hero/page-hero';
import { TranslationPipe } from '@core/pipes/translation.pipe';

@Component({
  selector: 'app-terms-hero',
  imports: [PageHero, TranslationPipe],
  templateUrl: './hero-terms.html',
  styleUrl: './hero-terms.scss',
})
export class TermsHero {}
