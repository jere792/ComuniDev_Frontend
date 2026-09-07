import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationPipe } from '../../../../core/pipes/translation.pipe';

@Component({
  selector: 'app-cta',
  imports: [RouterLink, TranslationPipe],
  templateUrl: './cta.html',
  styleUrl: './cta.scss',
})
export class Cta {}
