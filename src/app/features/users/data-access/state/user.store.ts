import { Injectable, signal, computed, inject } from '@angular/core';
import { User } from '../../../../core/domain/models/user.model';
import { USER_REPOSITORY, UserRepository } from '../../domain/ports/user.repository';

@Injectable({ providedIn: 'root' })
export class UserStore {
  private repository = inject<UserRepository>(USER_REPOSITORY);

  readonly users = signal<User[]>([]);
  readonly selectedUser = signal<User | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly totalCount = computed(() => this.users().length);

  loadAll(): void {
    this.loading.set(true);
    this.error.set(null);
    this.repository.getAll().subscribe({
      next: (users: User[]) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (_err: unknown) => {
        this.error.set('Error al cargar usuarios');
        this.loading.set(false);
      },
    });
  }

  update(id: string, data: Partial<User>): void {
    this.loading.set(true);
    this.error.set(null);
    this.repository.update(id, data).subscribe({
      next: (updatedUser: User) => {
        this.users.set(this.users().map(u => u.id === id ? updatedUser : u));
        this.loading.set(false);
      },
      error: (_err: unknown) => {
        this.error.set('Error al actualizar usuario');
        this.loading.set(false);
      },
    });
  }

  delete(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.repository.delete(id).subscribe({
      next: (success: boolean) => {
        if (success) {
          this.users.set(this.users().filter(u => u.id !== id));
        }
        this.loading.set(false);
      },
      error: (_err: unknown) => {
        this.error.set('Error al eliminar usuario');
        this.loading.set(false);
      },
    });
  }

  clear(): void {
    this.users.set([]);
    this.selectedUser.set(null);
    this.error.set(null);
  }
}
