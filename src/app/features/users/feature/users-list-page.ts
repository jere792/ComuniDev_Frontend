import { Component, OnInit, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '@core/domain/models/user.model';
import { UserStore } from '@features/users/data-access/state/user.store';
import { ToastService } from '@core/services/toast.service';
import { ConfirmModal } from '@shared/ui/confirm-modal/confirm-modal';

@Component({
  selector: 'app-users-list-page',
  standalone: true,
  imports: [CommonModule, ConfirmModal],
  templateUrl: './users-list.html',
  styleUrl: './users-list.scss',
})
export class UsersListPage implements OnInit {
  store = inject(UserStore);

  filteredUsers = signal<User[]>([]);
  searchTerm = signal('');
  confirmOpen = signal(false);
  pendingUserId = signal<string | null>(null);

  private toast = inject(ToastService);

  constructor() {
    effect(() => {
      const err = this.store.error();
      if (err) this.toast.error(err);
    });
  }

  get loading(): boolean {
    return this.store.loading();
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

  askDeleteUser(userId: string): void {
    this.pendingUserId.set(userId);
    this.confirmOpen.set(true);
  }

  onConfirmDelete(): void {
    const userId = this.pendingUserId();
    this.confirmOpen.set(false);
    this.pendingUserId.set(null);
    if (!userId) return;

    this.store.delete(userId).subscribe({
      next: () => this.toast.success('Usuario eliminado correctamente'),
      error: () => this.toast.error('Error al eliminar el usuario'),
    });
  }

  onCancelDelete(): void {
    this.confirmOpen.set(false);
    this.pendingUserId.set(null);
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
