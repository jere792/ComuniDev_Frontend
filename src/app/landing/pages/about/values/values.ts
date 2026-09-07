import { Component } from '@angular/core';
import { TranslationPipe } from '../../../../core/pipes/translation.pipe';

@Component({
  selector: 'app-about-values',
  imports: [TranslationPipe],
  templateUrl: './values.html',
  styleUrl: './values.scss',
})
export class AboutValues {}
