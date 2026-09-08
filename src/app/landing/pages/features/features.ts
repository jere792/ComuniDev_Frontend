import { Component } from '@angular/core';
import { TranslationPipe } from '../../../core/pipes/translation.pipe';
import { RevealDirective } from '../../../shared/directives/reveal/reveal.directive';

@Component({
  selector: 'app-features',
  imports: [TranslationPipe, RevealDirective],
  templateUrl: './features.html',
  styleUrl: './features.scss',
})
export class Features {}
