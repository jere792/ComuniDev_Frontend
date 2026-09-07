import { Component } from '@angular/core';
import { TranslationPipe } from '../../../../core/pipes/translation.pipe';

@Component({
  selector: 'app-feed',
  imports: [TranslationPipe],
  templateUrl: './feed.html',
  styleUrl: './feed.scss',
})
export class Feed {}
