import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AuthStore } from '../../data-access/state/auth.store';

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
    this.route.queryParams.subscribe(params => {
      this.authStore.handleOAuthCallback(params);
    });
  }
}
