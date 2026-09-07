import { Component } from '@angular/core';
import { TranslationPipe } from '../../../../core/pipes/translation.pipe';

@Component({
  selector: 'app-enfoque',
  imports: [TranslationPipe],
  templateUrl: './enfoque.html',
  styleUrl: './enfoque.scss',
})
export class Enfoque {}
