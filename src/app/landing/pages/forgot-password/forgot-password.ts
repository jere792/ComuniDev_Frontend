import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationPipe } from '../../../core/pipes/translation.pipe';
import { RevealDirective } from '../../../shared/directives/reveal/reveal.directive';

@Component({
  selector: 'app-forgot-password',
  imports: [RouterLink, TranslationPipe, RevealDirective],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {}
