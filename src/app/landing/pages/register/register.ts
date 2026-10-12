import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { TranslationPipe } from '@core/pipes/translation.pipe';
import { RevealDirective } from '@shared/directives/reveal/reveal.directive';
import { AuthService } from '@core/services/auth.service';
import { COMPANY_REPOSITORY } from '@features/recruiter/pages/company/domain/ports/company.repository';

interface Country {
  flag: string;
  code: string;
  dial: string;
  name: string;
}

@Component({
  selector: 'app-register',
  imports: [RouterLink, FormsModule, TranslationPipe, RevealDirective],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private authService = inject(AuthService);
  private router = inject(Router);
  private companyRepository = inject(COMPANY_REPOSITORY);

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

  /** Datos de empresa, solo cuando el rol es RECRUITER y declara tener una. */
  tieneEmpresa = signal(false);
  empresaNombre = signal('');
  empresaPais = signal('');
  /** true si el registro salió pero la empresa no pudo crearse. */
  empresaPendiente = signal(false);

  countries: Country[] = [
    { flag: 'pe', code: 'PE', dial: '+51', name: 'Perú' },
    { flag: 'mx', code: 'MX', dial: '+52', name: 'México' },
    { flag: 'ar', code: 'AR', dial: '+54', name: 'Argentina' },
    { flag: 'cl', code: 'CL', dial: '+56', name: 'Chile' },
    { flag: 'co', code: 'CO', dial: '+57', name: 'Colombia' },
    { flag: 've', code: 'VE', dial: '+58', name: 'Venezuela' },
    { flag: 'ec', code: 'EC', dial: '+593', name: 'Ecuador' },
    { flag: 'uy', code: 'UY', dial: '+598', name: 'Uruguay' },
    { flag: 'us', code: 'US', dial: '+1', name: 'Estados Unidos' },
    { flag: 'es', code: 'ES', dial: '+34', name: 'España' },
    { flag: 'br', code: 'BR', dial: '+55', name: 'Brasil' },
    { flag: 'bo', code: 'BO', dial: '+591', name: 'Bolivia' },
    { flag: 'py', code: 'PY', dial: '+595', name: 'Paraguay' },
    { flag: 'cr', code: 'CR', dial: '+506', name: 'Costa Rica' },
    { flag: 'pa', code: 'PA', dial: '+507', name: 'Panamá' },
    { flag: 'gt', code: 'GT', dial: '+502', name: 'Guatemala' },
    { flag: 'do', code: 'DO', dial: '+1', name: 'República Dominicana' },
    { flag: 'cu', code: 'CU', dial: '+53', name: 'Cuba' },
  ];

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

  get isRecruiter(): boolean {
    return this.rol() === 'RECRUITER';
  }

  get formValid(): boolean {
    const cuentaValida =
      this.nombre().trim().length > 0 &&
      this.usernameValid &&
      this.emailValid &&
      this.passwordValid &&
      this.passwordsMatch;

    if (!this.isRecruiter || !this.tieneEmpresa()) return cuentaValida;

    return cuentaValida && this.empresaNombre().trim().length > 0 && !!this.empresaPais();
  }

  async onSubmit(): Promise<void> {
    if (!this.formValid) return;
    this.submitted.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.empresaPendiente.set(false);

    const fullName = this.apellido()
      ? `${this.nombre()} ${this.apellido()}`
      : this.nombre();

    try {
      const user = await this.authService.register(
        fullName,
        this.nombreUsuario(),
        this.email(),
        this.password(),
        this.rol(),
        this.telefono() ? `${this.phoneCode()}${this.telefono()}` : undefined
      );

      if (this.isRecruiter && this.tieneEmpresa()) {
        await this.createCompany(String(user?.id ?? ''));
      }

      this.successMessage.set('Cuenta creada exitosamente. Ahora puedes iniciar sesion.');
      setTimeout(() => this.router.navigate(['/']), 2000);
    } catch (err: any) {
      this.errorMessage.set(err?.error?.message || 'Error al crear la cuenta');
    }
  }

  /**
   * Crea la empresa mínima con el correo de la cuenta como contacto.
   * Si falla no se bloquea el registro: queda pendiente de crear en
   * /recruiter/company, y el formulario de oferta ya lo avisa.
   */
  private async createCompany(recruiterId: string): Promise<void> {
    if (!recruiterId) {
      this.empresaPendiente.set(true);
      return;
    }

    try {
      await firstValueFrom(
        this.companyRepository.createCompany({
          recruiterId,
          nombre: this.empresaNombre().trim(),
          contacto: { email: this.email().trim(), telefono: null },
          ubicacion: { pais: this.empresaPais(), ciudad: null, distrito: null, direccion: null },
        }),
      );
    } catch {
      this.empresaPendiente.set(true);
    }
  }
}
