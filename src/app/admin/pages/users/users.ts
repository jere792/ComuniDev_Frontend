import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GraphQLService, User } from '../../../core/services/graphql.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class AdminUsers implements OnInit {
  users = signal<User[]>([]);
  filteredUsers = signal<User[]>([]);
  searchTerm = signal('');
  loading = signal(true);
  errorMessage = signal('');
  deleteMessage = signal('');

  constructor(private graphql: GraphQLService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.graphql.getUsers().subscribe({
      next: (users: User[]) => {
        this.users.set(users);
        this.filteredUsers.set(users);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading users:', err);
        this.errorMessage.set('Error al cargar usuarios');
        this.loading.set(false);
      },
    });
  }

  onSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchTerm.set(term);
    
    if (!term) {
      this.filteredUsers.set(this.users());
      return;
    }

    const filtered = this.users().filter(user =>
      user.nombre.toLowerCase().includes(term) ||
      user.nombreUsuario.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.rolActivo.toLowerCase().includes(term)
    );
    this.filteredUsers.set(filtered);
  }

  deleteUser(userId: string): void {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) {
      return;
    }

    this.graphql.deleteUser(userId).subscribe({
      next: (success: boolean) => {
        if (success) {
          this.users.set(this.users().filter(u => u.id !== userId));
          this.filteredUsers.set(this.filteredUsers().filter(u => u.id !== userId));
          this.deleteMessage.set('Usuario eliminado correctamente');
          setTimeout(() => this.deleteMessage.set(''), 3000);
        }
      },
      error: (err: any) => {
        console.error('Error deleting user:', err);
        this.errorMessage.set('Error al eliminar usuario');
      },
    });
  }

  getRoleBadgeClass(role: string): string {
    switch (role?.toLowerCase()) {
      case 'developer': return 'badge-developer';
      case 'recruiter': return 'badge-recruiter';
      case 'admin': return 'badge-admin';
      case 'moderator': return 'badge-moderator';
      default: return 'badge-default';
    }
  }

  getStatusBadgeClass(status: string): string {
    return status === 'ACTIVE' ? 'badge-active' : 'badge-inactive';
  }
}
