import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Login } from './login/login';
import { TranslationPipe } from '../../../../core/pipes/translation.pipe';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-hero',
  imports: [RouterLink, ReactiveFormsModule, Login, TranslationPipe],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero {
  loginForm: FormGroup;
  loginError = '';

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async onLogin(): Promise<void> {
    if (this.loginForm.valid) {
      this.loginError = '';
      const { email, password } = this.loginForm.value;
      try {
        const data = await this.authService.login(email, password);
        this.authService.navigateByRole(data.rolActivo);
      } catch (err: any) {
        this.loginError = err?.error?.message || 'Credenciales invalidas';
      }
    }
  }

  onGoogleAuth(): void {
    console.log('Google OAuth - pendiente integracion');
  }

  onGitHubAuth(): void {
    window.location.href = `${environment.apiUrl}/auth/github`;
  }
}
