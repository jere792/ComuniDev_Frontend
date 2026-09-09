import { Component } from '@angular/core';
import { StoriesComponent } from './stories/stories';
import { SearchComponent } from './search/search';
import { ReportsComponent } from './reports/reports';

@Component({
  selector: 'app-recruiter-inicio',
  imports: [StoriesComponent, SearchComponent, ReportsComponent],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class RecruiterInicio {}
