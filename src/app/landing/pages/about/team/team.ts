import { Component } from '@angular/core';
import { TranslationPipe } from '../../../../core/pipes/translation.pipe';
import { RevealDirective } from '../../../../shared/directives/reveal/reveal.directive';

@Component({
  selector: 'app-about-team',
  imports: [TranslationPipe, RevealDirective],
  templateUrl: './team.html',
  styleUrl: './team.scss',
})
export class AboutTeam {}
