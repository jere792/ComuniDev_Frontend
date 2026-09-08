import { Component } from '@angular/core';
import { TranslationPipe } from '../../../../core/pipes/translation.pipe';
import { RevealDirective } from '../../../../shared/directives/reveal/reveal.directive';

@Component({
  selector: 'app-download-apk-section',
  imports: [TranslationPipe, RevealDirective],
  templateUrl: './download.html',
  styleUrl: './download.scss',
})
export class DownloadApkSection {}
