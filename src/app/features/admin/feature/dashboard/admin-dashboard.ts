import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User, Stats } from '../../../../core/domain/models/user.model';
import { GraphQLService } from '../../../../core/services/graphql.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <div class="page-header">
        <h1 class="headline-lg">Dashboard Admin</h1>
      </div>
      @if (loading()) {
        <div class="loading-state">Cargando estadísticas...</div>
      }
      @if (errorMessage()) {
        <div class="error-message">{{ errorMessage() }}</div>
      }
      @if (!loading() && !errorMessage()) {
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">{{ stats().totalUsers }}</span>
            <span class="stat-label">Total Usuarios</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ stats().developers }}</span>
            <span class="stat-label">Developers</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ stats().recruiters }}</span>
            <span class="stat-label">Recruiters</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ stats().activeUsers }}</span>
            <span class="stat-label">Activos</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-container { width: 100%; max-width: 1200px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1.5rem; }
    .stat-card { text-align: center; padding: 1.5rem; background: var(--surface); border-radius: 12px; }
    .stat-value { display: block; font-size: 2rem; font-weight: bold; color: var(--primary); }
    .stat-label { font-size: 0.875rem; color: var(--text-secondary); }
    .loading-state { text-align: center; padding: 2rem; color: var(--text-secondary); }
    .error-message { padding: 1rem; background: var(--error); color: white; border-radius: 8px; }
  `],
})
export class AdminDashboard implements OnInit {
  stats = signal<Stats>({ totalUsers: 0, developers: 0, recruiters: 0, admins: 0, activeUsers: 0 });
  loading = signal(true);
  errorMessage = signal('');

  constructor(private graphql: GraphQLService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading.set(true);
    this.graphql.getUsers().subscribe({
      next: (users: User[]) => {
        this.stats.set({
          totalUsers: users.length,
          developers: users.filter(u => u.rolActivo === 'DEVELOPER').length,
          recruiters: users.filter(u => u.rolActivo === 'RECRUITER').length,
          admins: users.filter(u => u.rolActivo === 'ADMIN').length,
          activeUsers: users.filter(u => u.estadoCuenta === 'ACTIVE').length,
        });
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al cargar estadísticas');
        this.loading.set(false);
      },
    });
  }
}
