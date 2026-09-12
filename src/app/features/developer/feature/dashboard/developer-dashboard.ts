import { Component } from '@angular/core';
import { SharedRightPanel } from '../../../shared/ui/right-panel/right-panel';

@Component({
  selector: 'app-developer-dashboard',
  standalone: true,
  imports: [SharedRightPanel],
  template: `
    <div class="dashboard-layout">
      <div class="dashboard-container">
        <div class="page-header">
          <h1 class="headline-lg">Dashboard Developer</h1>
        </div>
        <div class="page-content">
          <div class="card">
            <p class="body-md">Bienvenido al panel de developer.</p>
          </div>
        </div>
      </div>
      <app-shared-right-panel role="developer" />
    </div>
  `,
  styles: [`
    .dashboard-layout {
      display: flex;
      width: 100%;
      max-width: 1100px;
      margin: 0 auto;
    }
    .dashboard-container {
      flex: 1;
      max-width: 600px;
    }
  `],
})
export class DeveloperDashboard {}
