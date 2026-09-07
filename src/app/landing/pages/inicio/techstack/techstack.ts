import { Component } from '@angular/core';
import { TranslationPipe } from '../../../../core/pipes/translation.pipe';

@Component({
  selector: 'app-techstack',
  imports: [TranslationPipe],
  templateUrl: './techstack.html',
  styleUrl: './techstack.scss',
})
export class Techstack {}
