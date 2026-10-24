import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserStore } from '@features/users/data-access/state/user.store';

export interface BottomNavLink {
  label: string;
  route: string;
  icon?: string;
}

//barra de navegación inferior para pantallas chicas: muestra las mismas rutas
//del header, como en la app móvil. El ítem de perfil muestra la foto del usuario.
@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './bottom-nav.html',
  styleUrl: './bottom-nav.scss',
})
export class BottomNav implements OnInit {
  @Input() links: BottomNavLink[] = [];

  private userStore = inject(UserStore);

  /** Foto de perfil del usuario logueado (se muestra en el ítem de perfil).
   *  Es una señal: al resolverse la query asíncrona no dispara
   *  ExpressionChangedAfterItHasBeenCheckedError (NG0100) en el @if. */
  readonly avatarUrl = signal('');

  ngOnInit(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.userStore.getById(userId).subscribe({
        next: (user) => {
          this.avatarUrl.set(user?.fotoPerfilUrl ?? '');
        },
      });
    }
  }

  /** El perfil muestra la foto del usuario; el resto, su ícono. */
  esPerfil(route: string): boolean {
    return route.includes('profile');
  }

  /**
   * En móvil el footer se mantiene en 5 rutas: Candidatos se busca desde
   * Ofertas y Solicitudes vive como pestaña dentro de Mensajes.
   */
  get linksMovil(): BottomNavLink[] {
    return this.links.filter(l => l.label !== 'Candidatos' && l.label !== 'Solicitudes');
  }
}
