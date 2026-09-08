import { Component } from '@angular/core';
import { TranslationPipe } from '../../../../core/pipes/translation.pipe';
import { RevealDirective } from '../../../../shared/directives/reveal/reveal.directive';

@Component({
  selector: 'app-about-mission',
  imports: [TranslationPipe, RevealDirective],
  templateUrl: './mission.html',
  styleUrl: './mission.scss',
})
export class AboutMission {}
