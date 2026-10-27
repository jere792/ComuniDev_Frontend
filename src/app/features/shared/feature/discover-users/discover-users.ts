import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { UserStore } from '@features/users/data-access/state/user.store';
import { FollowStore } from '@features/shared/data-access/state/follow.store';
import { User } from '@core/domain/models/user.model';
import { ToastService } from '@core/services/toast.service';

interface UserWithFollow extends User {
  isFollowing: boolean;
  followers: { seguidorId: string }[];
}

@Component({
  selector: 'app-discover-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './discover-users.html',
  styleUrl: './discover-users.scss',
})
export class DiscoverUsers implements OnInit {
  users = signal<UserWithFollow[]>([]);
  loading = signal(true);
  /** Descubrir pagina de a 25; "Cargar más" trae la siguiente página. */
  readonly hayMas = signal(false);
  readonly cargandoMas = signal(false);
  private pagina = 0;
  private static readonly TAMANO = 25;
  /** A quién sigo: una sola consulta y se compara en memoria (antes: 1 isFollowing por tarjeta). */
  private siguiendo = new Set<string>();
  /** Respaldo: la lista de seguidos falló y hay que preguntar tarjeta por tarjeta. */
  private consultarSeguimientoPorTarjeta = false;

  private userStore = inject(UserStore);
  private followService = inject(FollowStore);
  private router = inject(Router);
  private location = inject(Location);
  private toast = inject(ToastService);

  ngOnInit(): void {
    this.loadUsers();
  }

  cargarMas(): void {
    if (this.cargandoMas() || !this.hayMas()) return;
    this.cargarPagina(++this.pagina, true);
  }

  private loadUsers(): void {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) return;
    this.pagina = 0;

    this.followService.getFollowing(currentUserId).subscribe({
      next: (follows) => {
        this.siguiendo = new Set(follows.map(f => f.seguidoId).filter((id): id is string => Boolean(id)));
        this.cargarPagina(0, false);
      },
      // si la lista de seguidos falla (p.ej. backend local desactualizado), no
      // mentimos: se pregunta por cada tarjeta visible en vez de dejar todo en "Seguir"
      error: () => {
        this.consultarSeguimientoPorTarjeta = true;
        this.cargarPagina(0, false);
      },
    });
  }

  /** Respaldo: isFollowing tarjeta por tarjeta (solo visible si falló la lista de seguidos). */
  private marcarSeguimientoPorTarjeta(): void {
    const yo = localStorage.getItem('userId');
    if (!yo) return;
    this.users().forEach((u, i) => {
      if (!u.id) return;
      this.followService.isFollowing(yo, u.id).subscribe({
        next: (siguiendo) => {
          this.users.update(list => list.map((item, j) =>
            j === i ? { ...item, isFollowing: siguiendo } : item
          ));
        },
      });
    });
  }

  private cargarPagina(pagina: number, acumular: boolean): void {
    if (acumular) this.cargandoMas.set(true);
    const yo = localStorage.getItem('userId');

    this.userStore.getPagina(pagina, DiscoverUsers.TAMANO).subscribe({
      next: (users: User[]) => {
        const enriquecidos = users
          .filter(u => u.id !== yo)
          .map(u => ({
            ...u,
            isFollowing: this.siguiendo.has(u.id ?? ''),
            followers: [],
          }));
        this.hayMas.set(users.length >= DiscoverUsers.TAMANO);
        this.users.update(lista => (acumular ? [...lista, ...enriquecidos] : enriquecidos));
        this.loading.set(false);
        this.cargandoMas.set(false);
        if (this.consultarSeguimientoPorTarjeta) this.marcarSeguimientoPorTarjeta();
      },
      error: () => {
        this.loading.set(false);
        this.cargandoMas.set(false);
      },
    });
  }

  toggleFollow(user: UserWithFollow): void {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId || !user.id) return;

    if (user.isFollowing) {
      this.followService.unfollow(currentUserId, user.id).subscribe({
        next: () => {
          this.users.update(list => list.map(u =>
            u.id === user.id ? { ...u, isFollowing: false } : u
          ));
          this.toast.success('Dejaste de seguir a este usuario');
        },
        error: () => this.toast.error('Error al dejar de seguir'),
      });
    } else {
      this.followService.follow(currentUserId, user.id).subscribe({
        next: () => {
          this.users.update(list => list.map(u =>
            u.id === user.id ? { ...u, isFollowing: true } : u
          ));
          this.toast.success('Ahora sigues a este usuario');
        },
        error: () => this.toast.error('Error al seguir'),
      });
    }
  }

  goToProfile(userId: string): void {
    this.router.navigate(['/profile', userId]);
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    }
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }
}
