import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Login } from './login/login';
import { TranslationPipe } from '../../../../core/pipes/translation.pipe';

@Component({
  selector: 'app-hero',
  imports: [RouterLink, ReactiveFormsModule, Login, TranslationPipe],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero {
  loginForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      console.log('Login:', this.loginForm.value);
    }
  }

  onGoogleAuth(): void {
    console.log('Google OAuth - pendiente integración');
  }

  onGitHubAuth(): void {
    console.log('GitHub OAuth - pendiente integración');
  }
}
