import { Component } from '@angular/core';
import { TranslationPipe } from '../../../../core/pipes/translation.pipe';

@Component({
  selector: 'app-about-team',
  imports: [TranslationPipe],
  templateUrl: './team.html',
  styleUrl: './team.scss',
})
export class AboutTeam {}
