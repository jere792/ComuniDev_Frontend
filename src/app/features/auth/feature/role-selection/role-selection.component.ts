import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AuthStore } from '../../data-access/state/auth.store';

@Component({
  selector: 'app-role-selection',
  standalone: true,
  imports: [CommonModule],
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

        @if (store.error()) {
          <p class="form-error">{{ store.error() }}</p>
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

  constructor(
    private route: ActivatedRoute,
    public store: AuthStore,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.userId = params['userId'] || '';
      this.token = params['token'] || '';
      if (!this.userId || !this.token) {
        this.store.logout();
      }
    });
  }

  selectRole(role: string): void {
    this.store.completeRole(this.userId, role);
  }
}
