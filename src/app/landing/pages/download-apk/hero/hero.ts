import { Component } from '@angular/core';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';
import { TranslationPipe } from '../../../../core/pipes/translation.pipe';

@Component({
  selector: 'app-download-hero',
  imports: [PageHero, TranslationPipe],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class DownloadHero {}
