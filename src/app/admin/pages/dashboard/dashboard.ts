import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphQLService } from '../../../core/services/graphql.service';

interface Stats {
  totalUsers: number;
  developers: number;
  recruiters: number;
  admins: number;
  activeUsers: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class AdminDashboard implements OnInit {
  stats = signal<Stats>({
    totalUsers: 0,
    developers: 0,
    recruiters: 0,
    admins: 0,
    activeUsers: 0,
  });
  loading = signal(true);
  errorMessage = signal('');

  constructor(private graphql: GraphQLService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.graphql.getUsers().subscribe({
      next: (users: any[]) => {
        const developers = users.filter(u => u.rolActivo === 'DEVELOPER').length;
        const recruiters = users.filter(u => u.rolActivo === 'RECRUITER').length;
        const admins = users.filter(u => u.rolActivo === 'ADMIN').length;
        const activeUsers = users.filter(u => u.estadoCuenta === 'ACTIVE').length;

        this.stats.set({
          totalUsers: users.length,
          developers,
          recruiters,
          admins,
          activeUsers,
        });
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading stats:', err);
        this.errorMessage.set('Error al cargar estadísticas');
        this.loading.set(false);
      },
    });
  }
}
