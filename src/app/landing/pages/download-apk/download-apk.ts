import { Component } from '@angular/core';
import { DownloadHero } from '@landing/pages/download-apk/hero/hero';
import { DownloadApkSection } from '@landing/pages/download-apk/download/download';

@Component({
  selector: 'app-download-apk',
  imports: [DownloadHero, DownloadApkSection],
  templateUrl: './download-apk.html',
  styleUrl: './download-apk.scss',
})
export class DownloadApk {}
