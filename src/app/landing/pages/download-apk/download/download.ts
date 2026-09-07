import { Component } from '@angular/core';
import { TranslationPipe } from '../../../../core/pipes/translation.pipe';

@Component({
  selector: 'app-download-apk-section',
  imports: [TranslationPipe],
  templateUrl: './download.html',
  styleUrl: './download.scss',
})
export class DownloadApkSection {}
