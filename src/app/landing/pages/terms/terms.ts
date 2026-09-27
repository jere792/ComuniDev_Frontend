import { Component } from '@angular/core';
import { TermsHero } from '@landing/pages/terms/hero-terms/hero-terms';
import { TermsContent } from '@landing/pages/terms/content/content';

@Component({
  selector: 'app-terms',
  imports: [TermsHero, TermsContent],
  templateUrl: './terms.html',
})
export class Terms {}
