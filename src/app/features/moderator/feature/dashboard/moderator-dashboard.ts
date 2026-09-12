import { Component } from '@angular/core';

@Component({
  selector: 'app-moderator-dashboard',
  standalone: true,
  template: `
    <div class="page-header">
      <h1 class="headline-lg">Dashboard Moderator</h1>
    </div>
    <div class="page-content">
      <div class="card">
        <p class="body-md">Bienvenido al panel de moderación.</p>
      </div>
    </div>
  `,
})
export class ModeratorDashboard {}
