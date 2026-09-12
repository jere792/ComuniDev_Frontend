import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../../auth/data-access/state/auth.store';
import { GraphQLService } from '../../../../../core/services/graphql.service';
import { ThemeService } from '../../../../../core/services/theme.service';

@Component({
  selector: 'app-recruiter-sidebar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './recruiter-sidebar.html',
  styleUrl: './recruiter-sidebar.scss',
})
export class RecruiterSidebar implements OnInit {
  private authStore = inject(AuthStore);
  private graphql = inject(GraphQLService);
  private theme = inject(ThemeService);

  user = this.authStore.user;
  photoUrl = signal<string | null>(null);
  isDark = this.theme.dark;

  ngOnInit(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.graphql.getUser(userId).subscribe(u => {
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
