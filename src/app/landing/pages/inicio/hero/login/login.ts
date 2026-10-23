import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { TranslationPipe } from '@core/pipes/translation.pipe';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule, TranslationPipe],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  @Input({ required: true }) form!: FormGroup;
  @Input() error: string = '';
  @Output() submitLogin = new EventEmitter<void>();
  @Output() googleAuth = new EventEmitter<void>();
  @Output() githubAuth = new EventEmitter<void>();

  /** "Recordarme": guarda y prellena correo y contraseña (solo prototipo/demo). */
  recordar = false;

  /** Muestra/oculta la contraseña en el input. */
  verPassword = false;

  ngOnInit(): void {
    try {
      const guardado = localStorage.getItem('recordarme');
      if (guardado) {
        const { email, password } = JSON.parse(guardado);
        this.form.patchValue({ email, password });
        this.recordar = true;
      }
    } catch {
      // datos corruptos o modo privado: se ignora
    }
  }

  onSubmit(): void {
    try {
      if (this.recordar) {
        localStorage.setItem(
          'recordarme',
          JSON.stringify({
            email: this.form.value.email ?? '',
            password: this.form.value.password ?? '',
          }),
        );
      } else {
        localStorage.removeItem('recordarme');
      }
    } catch {
      // modo privado: no se puede guardar
    }
    this.submitLogin.emit();
  }

  onGoogleAuth(): void {
    this.googleAuth.emit();
  }

  onGitHubAuth(): void {
    this.githubAuth.emit();
  }
}
