import { Component } from '@angular/core';
import { TranslationPipe } from '../../../core/pipes/translation.pipe';

@Component({
  selector: 'app-features',
  imports: [TranslationPipe],
  templateUrl: './features.html',
  styleUrl: './features.scss',
})
export class Features {}
