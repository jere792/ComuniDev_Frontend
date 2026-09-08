import { Component } from '@angular/core';
import { TranslationPipe } from '../../../../core/pipes/translation.pipe';
import { RevealDirective } from '../../../../shared/directives/reveal/reveal.directive';

@Component({
  selector: 'app-techstack',
  imports: [TranslationPipe, RevealDirective],
  templateUrl: './techstack.html',
  styleUrl: './techstack.scss',
})
export class Techstack {}
