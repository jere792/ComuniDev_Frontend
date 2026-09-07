import { Component } from '@angular/core';
import { DownloadHero } from './hero/hero';
import { DownloadApkSection } from './download/download';

@Component({
  selector: 'app-download-apk',
  imports: [DownloadHero, DownloadApkSection],
  templateUrl: './download-apk.html',
  styleUrl: './download-apk.scss',
})
export class DownloadApk {}
