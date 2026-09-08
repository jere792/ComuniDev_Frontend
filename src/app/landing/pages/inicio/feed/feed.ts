import { Component } from '@angular/core';
import { TranslationPipe } from '../../../../core/pipes/translation.pipe';
import { RevealDirective } from '../../../../shared/directives/reveal/reveal.directive';

@Component({
  selector: 'app-feed',
  imports: [TranslationPipe, RevealDirective],
  templateUrl: './feed.html',
  styleUrl: './feed.scss',
})
export class Feed {}
