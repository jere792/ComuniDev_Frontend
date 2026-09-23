import { Component } from '@angular/core';
import { StoriesComponent } from '@features/recruiter/pages/inicio/feature/stories/stories';
import { ReportsComponent } from '@features/recruiter/pages/inicio/feature/reports/reports';
import { SharedRightPanel } from '@features/shared/ui/right-panel/right-panel';

@Component({
  selector: 'app-recruiter-inicio',
  imports: [StoriesComponent, ReportsComponent, SharedRightPanel],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class RecruiterInicio {}
