import { Component } from '@angular/core';
import { StoriesComponent } from './stories/stories';
import { ReportsComponent } from './reports/reports';
import { SharedRightPanel } from '../../../shared/ui/right-panel/right-panel';

@Component({
  selector: 'app-recruiter-inicio',
  imports: [StoriesComponent, ReportsComponent, SharedRightPanel],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class RecruiterInicio {}
