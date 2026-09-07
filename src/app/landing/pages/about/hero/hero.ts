import { Component } from '@angular/core';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';

@Component({
  selector: 'app-about-hero',
  imports: [PageHero],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class AboutHero {}
