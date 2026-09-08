import { Component } from '@angular/core';
import { TranslationPipe } from '../../../../core/pipes/translation.pipe';
import { RevealDirective } from '../../../../shared/directives/reveal/reveal.directive';

@Component({
  selector: 'app-enfoque',
  imports: [TranslationPipe, RevealDirective],
  templateUrl: './enfoque.html',
  styleUrl: './enfoque.scss',
})
export class Enfoque {}
