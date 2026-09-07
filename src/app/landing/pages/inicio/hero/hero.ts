import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-hero',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero {
  authMode: 'login' | 'register' = 'login';

  loginForm: FormGroup;
  registerForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  toggleMode(mode: 'login' | 'register'): void {
    this.authMode = mode;
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      console.log('Login:', this.loginForm.value);
    }
  }

  onRegister(): void {
    if (this.registerForm.valid) {
      console.log('Register:', this.registerForm.value);
    }
  }

  onGoogleAuth(): void {
    console.log('Google OAuth - pendiente integración');
  }

  onGitHubAuth(): void {
    console.log('GitHub OAuth - pendiente integración');
  }
}
