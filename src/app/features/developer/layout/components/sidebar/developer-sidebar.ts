import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@features/auth/data-access/state/auth.store';
import { UserStore } from '@features/users/data-access/state/user.store';
import { MessageStore } from '@features/shared/data-access/state/message.store';
import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-developer-sidebar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './developer-sidebar.html',
  styleUrl: './developer-sidebar.scss',
})
export class DeveloperSidebar implements OnInit {
  private authStore = inject(AuthStore);
  private userStore = inject(UserStore);
  private messageStore = inject(MessageStore);
  private theme = inject(ThemeService);

  user = this.authStore.user;
  photoUrl = signal<string | null>(null);
  isDark = this.theme.dark;
  /** No leidos globales: badge del acceso a Mensajes. */
  readonly noLeidos = this.messageStore.noLeidos;

  ngOnInit(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.userStore.getById(userId).subscribe(u => {
        if (u?.fotoPerfilUrl) {
          this.photoUrl.set(u.fotoPerfilUrl);
        }
      });
    }
  }

  logout(): void {
    this.authStore.logout();
  }

  toggleTheme(): void {
    this.theme.toggle();
  }
}
