import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslationPipe } from '../../../core/pipes/translation.pipe';
import { RevealDirective } from '../../../shared/directives/reveal/reveal.directive';
import { AuthService } from '../../../core/services/auth.service';

interface Country {
  flag: string;
  code: string;
  dial: string;
}

@Component({
  selector: 'app-register',
  imports: [RouterLink, FormsModule, TranslationPipe, RevealDirective],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  nombre = signal('');
  apellido = signal('');
  nombreUsuario = signal('');
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  phoneCode = signal('+51');
  telefono = signal('');
  rol = signal('DEVELOPER');
  submitted = signal(false);
  showCountryDropdown = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  countries: Country[] = [
    { flag: 'pe', code: 'PE', dial: '+51' },
    { flag: 'mx', code: 'MX', dial: '+52' },
    { flag: 'ar', code: 'AR', dial: '+54' },
    { flag: 'cl', code: 'CL', dial: '+56' },
    { flag: 'co', code: 'CO', dial: '+57' },
    { flag: 've', code: 'VE', dial: '+58' },
    { flag: 'ec', code: 'EC', dial: '+593' },
    { flag: 'uy', code: 'UY', dial: '+598' },
    { flag: 'us', code: 'US', dial: '+1' },
    { flag: 'es', code: 'ES', dial: '+34' },
    { flag: 'br', code: 'BR', dial: '+55' },
    { flag: 'bo', code: 'BO', dial: '+591' },
    { flag: 'py', code: 'PY', dial: '+595' },
    { flag: 'cr', code: 'CR', dial: '+506' },
    { flag: 'pa', code: 'PA', dial: '+507' },
    { flag: 'gt', code: 'GT', dial: '+502' },
    { flag: 'do', code: 'DO', dial: '+1' },
    { flag: 'cu', code: 'CU', dial: '+53' },
  ];

  constructor(private authService: AuthService, private router: Router) {}

  getFlagUrl(countryCode: string): string {
    return `https://flagcdn.io/${countryCode.toLowerCase()}.svg`;
  }

  selectedCountry(): Country {
    return this.countries.find(c => c.dial === this.phoneCode()) || this.countries[0];
  }

  toggleCountryDropdown(): void {
    this.showCountryDropdown.set(!this.showCountryDropdown());
  }

  selectCountry(country: Country): void {
    this.phoneCode.set(country.dial);
    this.showCountryDropdown.set(false);
  }

  get passwordValid(): boolean {
    return this.password().length >= 8;
  }

  get passwordsMatch(): boolean {
    return this.password() === this.confirmPassword();
  }

  get usernameValid(): boolean {
    const u = this.nombreUsuario();
    return u.length >= 3 && u.length <= 30;
  }

  get emailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email());
  }

  get formValid(): boolean {
    return (
      this.nombre().trim().length > 0 &&
      this.usernameValid &&
      this.emailValid &&
      this.passwordValid &&
      this.passwordsMatch
    );
  }

  async onSubmit(): Promise<void> {
    if (!this.formValid) return;
    this.errorMessage.set('');
    this.successMessage.set('');

    const fullName = this.apellido()
      ? `${this.nombre()} ${this.apellido()}`
      : this.nombre();

    try {
      await this.authService.register(
        fullName,
        this.nombreUsuario(),
        this.email(),
        this.password(),
        this.rol()
      );
      this.successMessage.set('Cuenta creada exitosamente. Ahora puedes iniciar sesion.');
      setTimeout(() => this.router.navigate(['/']), 2000);
    } catch (err: any) {
      this.errorMessage.set(err?.error?.message || 'Error al crear la cuenta');
    }
  }
}
