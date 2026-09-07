import { Component } from '@angular/core';
import { LayoutHeader } from './header/header';
import { LayoutMain } from './main/main';
import { LayoutFooter } from './footer/footer';

@Component({
  selector: 'app-landing-layout',
  imports: [LayoutHeader, LayoutMain, LayoutFooter],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class LandingLayout {}
