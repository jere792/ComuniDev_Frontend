import { Component } from '@angular/core';
import { TranslationPipe } from '../../../../core/pipes/translation.pipe';
import { RevealDirective } from '../../../../shared/directives/reveal/reveal.directive';

@Component({
  selector: 'app-about-values',
  imports: [TranslationPipe, RevealDirective],
  templateUrl: './values.html',
  styleUrl: './values.scss',
})
export class AboutValues {}
