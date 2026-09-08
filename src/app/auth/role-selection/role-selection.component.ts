import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-role-selection',
  template: `
    <div class="role-page">
      <div class="role-card">
        <h1 class="headline-md">Selecciona tu rol</h1>
        <p class="body-md">Elige como quieres usar ComuniDev</p>

        <div class="role-buttons">
          <button class="role-btn" (click)="selectRole('DEVELOPER')">
            <span class="material-symbols-outlined">code</span>
            <span class="label-md">Desarrollador</span>
            <span class="body-sm">Busca oportunidades y conecta con otros devs</span>
          </button>
          <button class="role-btn" (click)="selectRole('RECRUITER')">
            <span class="material-symbols-outlined">work</span>
            <span class="label-md">Reclutador</span>
            <span class="body-sm">Encuentra talento para tu empresa</span>
          </button>
        </div>

        @if (error()) {
          <p class="form-error">{{ error() }}</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .role-page {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: var(--bg-primary);
    }
    .role-card {
      text-align: center;
      padding: 2rem;
      max-width: 500px;
      width: 100%;
    }
    .role-buttons {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
    }
    .role-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1.5rem;
      border: 2px solid var(--border);
      border-radius: 12px;
      background: var(--bg-secondary);
      cursor: pointer;
      transition: all 0.2s;
    }
    .role-btn:hover {
      border-color: var(--accent);
      background: var(--accent-bg);
    }
    .role-btn .material-symbols-outlined {
      font-size: 2rem;
      color: var(--accent);
    }
    .role-btn .body-sm {
      color: var(--text-secondary);
      font-size: 0.85rem;
    }
    .form-error {
      color: #e74c3c;
      margin-top: 1rem;
    }
  `],
})
export class RoleSelectionComponent implements OnInit {
  userId = '';
  token = '';
  error = signal('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.userId = params['userId'] || '';
      this.token = params['token'] || '';
      if (!this.userId || !this.token) {
        this.router.navigate(['/']);
      }
    });
  }

  async selectRole(role: string): Promise<void> {
    this.error.set('');
    try {
      const data = await new Promise<any>((resolve, reject) => {
        this.api.completeRole(this.userId, role).subscribe({
          next: resolve,
          error: reject,
        });
      });
      localStorage.setItem('token', this.token);
      localStorage.setItem('role', role.toLowerCase());
      localStorage.setItem('userId', this.userId);
      if (data.nombre) localStorage.setItem('userName', data.nombre);
      if (data.email) localStorage.setItem('userEmail', data.email);
      this.authService.navigateByRole(role);
    } catch (err: any) {
      this.error.set(err?.error?.message || 'Error al asignar rol');
    }
  }
}
