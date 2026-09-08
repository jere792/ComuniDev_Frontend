import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationPipe } from '../../../../core/pipes/translation.pipe';
import { RevealDirective } from '../../../../shared/directives/reveal/reveal.directive';

@Component({
  selector: 'app-cta',
  imports: [RouterLink, TranslationPipe, RevealDirective],
  templateUrl: './cta.html',
  styleUrl: './cta.scss',
})
export class Cta {}
