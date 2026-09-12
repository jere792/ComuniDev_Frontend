import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../core/domain/models/user.model';
import { UserStore } from '../data-access/state/user.store';

@Component({
  selector: 'app-users-list-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users-list.html',
  styleUrl: './users-list.scss',
})
export class UsersListPage implements OnInit {
  filteredUsers = signal<User[]>([]);
  searchTerm = signal('');
  deleteMessage = signal('');

  constructor(public store: UserStore) {}

  get loading(): boolean {
    return this.store.loading();
  }

  get errorMessage(): string | null {
    return this.store.error();
  }

  ngOnInit(): void {
    this.store.loadAll();
    this.filteredUsers.set(this.store.users());
  }

  onSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchTerm.set(term);

    if (!term) {
      this.filteredUsers.set(this.store.users());
      return;
    }

    const filtered = this.store.users().filter(user =>
      user.nombre.toLowerCase().includes(term) ||
      user.nombreUsuario.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.rolActivo.toLowerCase().includes(term)
    );
    this.filteredUsers.set(filtered);
  }

  deleteUser(userId: string): void {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

    this.store.delete(userId);
    this.deleteMessage.set('Usuario eliminado correctamente');
    setTimeout(() => this.deleteMessage.set(''), 3000);
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
