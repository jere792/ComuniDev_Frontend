import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout-main',
  imports: [RouterOutlet],
  template: '<main class="landing-main"><router-outlet /></main>',
  styleUrl: './main.scss',
})
export class LayoutMain {}
