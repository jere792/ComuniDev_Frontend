import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { TranslationPipe } from '../../../../../core/pipes/translation.pipe';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule, TranslationPipe],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  @Input({ required: true }) form!: FormGroup;
  @Input() error: string = '';
  @Output() submitLogin = new EventEmitter<void>();
  @Output() googleAuth = new EventEmitter<void>();
  @Output() githubAuth = new EventEmitter<void>();

  onSubmit(): void {
    this.submitLogin.emit();
  }

  onGoogleAuth(): void {
    this.googleAuth.emit();
  }

  onGitHubAuth(): void {
    this.githubAuth.emit();
  }
}
