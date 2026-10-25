import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Login } from '@landing/pages/inicio/hero/login/login';
import { TranslationPipe } from '@core/pipes/translation.pipe';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-hero',
  imports: [RouterLink, ReactiveFormsModule, Login, TranslationPipe],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  loginForm: FormGroup;
  loginError = '';

  constructor() {
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
        //sin conexión (servidor apagado) no es lo mismo que credenciales incorrectas
        const mensaje =
          err?.error?.message ||
          (err?.status === 0 ? 'No hay conexión con el servidor' : 'Credenciales inválidas');
        this.loginError = mensaje;
        //el texto bajo el campo se pasa por alto fácil: el toast deja constancia del fallo
        this.toast.error(mensaje);
      }
    }
  }

  onGoogleAuth(): void {
    window.location.href = `${environment.apiUrl}/auth/google`;
  }

  onGitHubAuth(): void {
    window.location.href = `${environment.apiUrl}/auth/github`;
  }
}
