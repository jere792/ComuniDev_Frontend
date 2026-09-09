import { Component } from '@angular/core';

@Component({
  selector: 'app-developer-dashboard',
  template: `
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
  `,
  styles: [`
    .dashboard-container {
      width: 100%;
      max-width: 1200px;
    }
  `],
})
export class DeveloperDashboard {}
