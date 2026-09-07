import { Component } from '@angular/core';
import { TranslationPipe } from '../../../../core/pipes/translation.pipe';

@Component({
  selector: 'app-about-mission',
  imports: [TranslationPipe],
  templateUrl: './mission.html',
  styleUrl: './mission.scss',
})
export class AboutMission {}
