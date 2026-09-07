import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationPipe } from '../../../core/pipes/translation.pipe';

@Component({
  selector: 'app-layout-footer',
  imports: [RouterLink, TranslationPipe],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class LayoutFooter {}
