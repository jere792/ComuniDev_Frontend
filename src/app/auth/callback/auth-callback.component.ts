import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-auth-callback',
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
  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const role = params['role'];
      const needsRole = params['needsRole'] === 'true';
      const userId = params['id'];
      const nombre = params['nombre'];
      const email = params['email'];

      if (needsRole && userId && token) {
        this.router.navigate(['/auth/role-selection'], {
          queryParams: { userId, token, nombre, email },
        });
        return;
      }

      if (token && role) {
        const normalizedRole = role.toLowerCase();
        localStorage.setItem('token', token);
        localStorage.setItem('role', normalizedRole);
        if (userId) localStorage.setItem('userId', userId);
        if (nombre) localStorage.setItem('userName', nombre);
        if (email) localStorage.setItem('userEmail', email);

        switch (normalizedRole) {
          case 'admin': this.router.navigate(['/admin']); break;
          case 'moderator': this.router.navigate(['/moderator']); break;
          case 'recruiter': this.router.navigate(['/recruiter']); break;
          default: this.router.navigate(['/developer']); break;
        }
      } else {
        this.router.navigate(['/']);
      }
    });
  }
}
