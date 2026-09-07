import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationPipe } from '../../../core/pipes/translation.pipe';

@Component({
  selector: 'app-forgot-password',
  imports: [RouterLink, TranslationPipe],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {}
