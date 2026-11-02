import { Component, OnInit, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '@core/domain/models/user.model';
import { UserStore } from '@features/users/data-access/state/user.store';
import { ToastService } from '@core/services/toast.service';
import { ConfirmModal } from '@shared/ui/confirm-modal/confirm-modal';
import { BanModal, BanPayload } from '@features/users/ui/ban-modal/ban-modal';
import { TipoBan } from '@features/users/domain/ports/user-moderation.repository';

/** Lee el mensaje de error que devuelve el backend en su `ApiResponse`. */
function mensajeError(err: unknown): string | null {
  const body = (err as { error?: { message?: string } } | null)?.error;
  return typeof body?.message === 'string' && body.message.trim() ? body.message : null;
}

@Component({
  selector: 'app-users-list-page',
  standalone: true,
  imports: [CommonModule, ConfirmModal, BanModal],
  templateUrl: './users-list.html',
  styleUrl: './users-list.scss',
})
export class UsersListPage implements OnInit {
  store = inject(UserStore);

  filteredUsers = signal<User[]>([]);
  searchTerm = signal('');
  confirmOpen = signal(false);
  pendingUserId = signal<string | null>(null);

  // ---------------------------------------------------- banear / desbanear
  banOpen = signal(false);
  banSending = signal(false);
  pendingBanUser = signal<User | null>(null);

  unbanOpen = signal(false);
  unbanSending = signal(false);
  pendingUnbanUser = signal<User | null>(null);

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

  // -------------------------------------------------------- banear / desbanear

  estaBaneado(user: User): boolean {
    return this.store.estaBaneado(user.id);
  }

  askBan(user: User): void {
    this.pendingBanUser.set(user);
    this.banOpen.set(true);
  }

  onCancelBan(): void {
    this.banOpen.set(false);
    this.pendingBanUser.set(null);
  }

  onConfirmBan(payload: BanPayload): void {
    const user = this.pendingBanUser();
    if (!user) return;

    const moderadorId = localStorage.getItem('userId');
    if (!moderadorId) {
      this.onCancelBan();
      this.toast.error('No se encontró tu usuario en sesión');
      return;
    }

    this.banSending.set(true);
    this.store
      .ban(user.id, {
        moderadorId,
        tipo: payload.tipo as TipoBan,
        razon: payload.razon,
        duracionDias: payload.duracionDias,
      })
      .subscribe({
        next: (info) => {
          this.banSending.set(false);
          this.onCancelBan();
          if (info?.baneado) {
            this.toast.success(
              payload.tipo === 'TEMPORAL'
                ? `Cuenta suspendida por ${payload.duracionDias} días`
                : 'Cuenta suspendida permanentemente',
            );
          } else {
            this.toast.error('No se pudo suspender la cuenta');
          }
        },
        error: (err) => {
          this.banSending.set(false);
          this.onCancelBan();
          this.toast.error(mensajeError(err) ?? 'No se pudo suspender la cuenta');
        },
      });
  }

  askUnban(user: User): void {
    this.pendingUnbanUser.set(user);
    this.unbanOpen.set(true);
  }

  onCancelUnban(): void {
    this.unbanOpen.set(false);
    this.pendingUnbanUser.set(null);
  }

  onConfirmUnban(): void {
    const user = this.pendingUnbanUser();
    if (!user) return;

    const moderadorId = localStorage.getItem('userId');
    if (!moderadorId) {
      this.onCancelUnban();
      this.toast.error('No se encontró tu usuario en sesión');
      return;
    }

    this.unbanSending.set(true);
    this.store.unban(user.id, { moderadorId }).subscribe({
      next: () => {
        this.unbanSending.set(false);
        this.onCancelUnban();
        this.toast.success('Cuenta reactivada correctamente');
      },
      error: (err) => {
        this.unbanSending.set(false);
        this.onCancelUnban();
        this.toast.error(mensajeError(err) ?? 'No se pudo reactivar la cuenta');
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
