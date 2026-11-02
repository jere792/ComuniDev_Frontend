import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AuthStore } from '@features/auth/data-access/state/auth.store';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback">
      <p>Autenticando...</p>
    </div>
  `,
  styles: [`
    .callback {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-size: 1.2rem;
    }
  `],
})
export class AuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authStore = inject(AuthStore);

  ngOnInit(): void {
    // Una sola lectura: al procesar la sesión se limpia la URL para que los
    // tokens no queden en el historial del navegador.
    const params = { ...this.route.snapshot.queryParams };
    if (Object.keys(params).length > 0) {
      window.history.replaceState(window.history.state, '', window.location.pathname);
    }
    // El store guarda access + refresh token (viene en ?token=...&refreshToken=...)
    // y redirige según el rol de la cuenta.
    this.authStore.handleOAuthCallback(params);
  }
}
