import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { TranslationPipe } from '@core/pipes/translation.pipe';
import { RevealDirective } from '@shared/directives/reveal/reveal.directive';
import { AuthService } from '@core/services/auth.service';
import { COMPANY_REPOSITORY } from '@features/recruiter/pages/company/domain/ports/company.repository';
import { COUNTRIES, Country } from '@shared/constants/countries';

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

  /** Términos y condiciones: el registro queda bloqueado hasta aceptarlos. */
  aceptaTerminos = signal(false);
  verTerminos = signal(false);

  /** Datos de empresa, solo cuando el rol es RECRUITER y declara tener una. */
  tieneEmpresa = signal(false);
  empresaNombre = signal('');
  empresaPais = signal('');
  /** true si el registro salió pero la empresa no pudo crearse. */
  empresaPendiente = signal(false);

  readonly countries: Country[] = COUNTRIES;

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
      this.apellido().trim().length > 0 &&
      this.usernameValid &&
      this.emailValid &&
      this.passwordValid &&
      this.passwordsMatch;

    const conTerminos = cuentaValida && this.aceptaTerminos();
    if (!this.isRecruiter || !this.tieneEmpresa()) return conTerminos;

    return conTerminos && this.empresaNombre().trim().length > 0 && !!this.empresaPais();
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
   * Configuración → Empresa, y el formulario de oferta ya lo avisa.
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
