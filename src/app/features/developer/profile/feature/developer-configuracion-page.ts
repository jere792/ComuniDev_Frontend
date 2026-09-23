import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { UserStore } from '@features/users/data-access/state/user.store';
import { AuthStore } from '@features/auth/data-access/state/auth.store';
import { ToastService } from '@core/services/toast.service';
import { catchError, of } from 'rxjs';
import { User } from '@core/domain/models/user.model';

interface ConfigItem {
  id: string;
  icon: string;
  label: string;
}

interface ConfigCategory {
  id: string;
  icon: string;
  label: string;
  subItems: ConfigItem[];
}

@Component({
  selector: 'app-developer-configuracion-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './developer-configuracion.html',
  styleUrl: './developer-configuracion.scss',
})
export class DeveloperConfiguracionPage implements OnInit {
  private fb = inject(FormBuilder);
  private userStore = inject(UserStore);
  private authStore = inject(AuthStore);
  private toast = inject(ToastService);

  userData = signal<User | null>(null);
  activeSection = signal('perfil-personal');
  expandedCategory = signal<string | null>('perfil');
  loading = signal(false);

  categories: ConfigCategory[] = [
    {
      id: 'perfil',
      icon: 'person',
      label: 'Perfil',
      subItems: [
        { id: 'perfil-personal', icon: 'badge', label: 'Información personal' },
        { id: 'perfil-descripcion', icon: 'description', label: 'Descripción' },
        { id: 'perfil-ubicacion', icon: 'location_on', label: 'Ubicación' },
      ],
    },
    {
      id: 'cuenta',
      icon: 'account_circle',
      label: 'Cuenta',
      subItems: [
        { id: 'cuenta-estado', icon: 'verified', label: 'Estado de cuenta' },
        { id: 'cuenta-contrasena', icon: 'lock_reset', label: 'Cambio de contraseña' },
        { id: 'cuenta-privacidad', icon: 'shield', label: 'Privacidad' },
        { id: 'cuenta-notificaciones', icon: 'notifications', label: 'Notificaciones' },
        { id: 'cuenta-terminos', icon: 'gavel', label: 'Términos y condiciones' },
      ],
    },
  ];

  disabledItems = [
    { id: 'seguridad', icon: 'security', label: 'Seguridad' },
    { id: 'idioma', icon: 'language', label: 'Idioma y región' },
  ];

  perfilForm = this.fb.group({
    nombre: [''],
    email: [''],
    telefono: [''],
  });

  descripcionForm = this.fb.group({
    bio: [''],
  });

  ubicacionForm = this.fb.group({
    pais: ['Perú'],
    departamento: [''],
    provincia: [''],
    ciudad: [''],
    distrito: [''],
    direccion: [''],
  });

  privacidadForm = this.fb.group({
    perfilPublico: [true],
    mostrarEmail: [false],
    mostrarTelefono: [false],
  });

  contrasenaForm = this.fb.group({
    actual: [''],
    nueva: [''],
    confirmar: [''],
  });

  notificacionesForm = this.fb.group({
    email: [true],
    push: [true],
    mensajes: [true],
    ofertas: [true],
  });

  ngOnInit(): void {
    this.loadUserData();
  }

  private getUserId(): string | null {
    return this.authStore.user()?.id || localStorage.getItem('userId');
  }

  private loadUserData(): void {
    const userId = this.getUserId();
    if (!userId) return;

    this.userStore.getById(userId).subscribe({
      next: (user: User | null) => {
        if (user) {
          this.userData.set(user);
          this.perfilForm.patchValue({
            nombre: user.nombre ?? '',
            email: user.email ?? '',
            telefono: user.telefono ?? '',
          } as never);
          this.descripcionForm.patchValue({
            bio: user.bio ?? '',
          } as never);
          if (user.ubicacion) {
            this.ubicacionForm.patchValue({
              pais: user.ubicacion.pais ?? 'Perú',
              departamento: user.ubicacion.departamento ?? '',
              provincia: user.ubicacion.provincia ?? '',
              ciudad: user.ubicacion.ciudad ?? '',
              distrito: user.ubicacion.distrito ?? '',
              direccion: user.ubicacion.direccion ?? '',
            } as never);
          }
        }
      },
      error: () => {},
    });
  }

  toggleCategory(id: string): void {
    this.expandedCategory.set(this.expandedCategory() === id ? null : id);
  }

  selectSubItem(id: string): void {
    if (this.activeSection() === id) return;
    this.loading.set(true);
    this.activeSection.set(id);
    setTimeout(() => this.loading.set(false), 300);
  }

  private showSuccess(): void {
    this.toast.success('Cambios guardados');
  }

  private handleError(err: unknown): void {
    const message = err instanceof Error ? err.message : 'Intente de nuevo';
    this.toast.error('Error al guardar: ' + message);
  }

  savePerfil(): void {
    const userId = this.getUserId();
    if (!userId) return;

    const formValue = this.perfilForm.value;
    this.userStore.update(userId, {
      nombre: formValue.nombre ?? undefined,
      email: formValue.email ?? undefined,
      telefono: formValue.telefono ?? undefined,
    } as never).pipe(
      catchError(err => {
        this.handleError(err);
        return of(null);
      })
    ).subscribe(result => {
      if (result) this.showSuccess();
    });
  }

  savingBio = signal(false);

  saveBio(): void {
    this.savingBio.set(true);
    const userId = this.getUserId();
    if (!userId) {
      this.savingBio.set(false);
      this.toast.error('Usuario no identificado');
      return;
    }

    const bioValue = this.descripcionForm.value.bio?.trim();
    if (!bioValue) {
      this.savingBio.set(false);
      this.toast.warning('La bio no puede estar vacía');
      return;
    }

    this.userStore.update(userId, { bio: bioValue } as never).pipe(
      catchError(err => {
        this.savingBio.set(false);
        this.handleError(err);
        return of(null);
      })
    ).subscribe(result => {
      this.savingBio.set(false);
      if (result) this.showSuccess();
      else this.toast.error('No se pudo guardar la bio');
    });
  }

  saveUbicacion(): void {
    const userId = this.getUserId();
    if (!userId) return;

    const formValue = this.ubicacionForm.value;
    this.userStore.update(userId, {
      ubicacion: {
        pais: formValue.pais ?? undefined,
        departamento: formValue.departamento ?? undefined,
        provincia: formValue.provincia ?? undefined,
        ciudad: formValue.ciudad ?? undefined,
        distrito: formValue.distrito ?? undefined,
        direccion: formValue.direccion ?? undefined,
      },
    } as never).pipe(
      catchError(err => {
        this.handleError(err);
        return of(null);
      })
    ).subscribe(result => {
      if (result) this.showSuccess();
    });
  }

  saveContrasena(): void {
    const userId = this.getUserId();
    if (!userId) return;

    const formValue = this.contrasenaForm.value;
    if (!formValue.actual || !formValue.nueva || !formValue.confirmar) {
      this.toast.warning('Todos los campos son requeridos');
      return;
    }
    if (formValue.nueva !== formValue.confirmar) {
      this.toast.warning('Las contraseñas no coinciden');
      return;
    }
    if (formValue.nueva.length < 6) {
      this.toast.warning('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.userStore.changePassword(userId, formValue.actual, formValue.nueva).pipe(
      catchError(err => {
        this.handleError(err);
        return of(null);
      })
    ).subscribe(result => {
      if (result === true) {
        this.contrasenaForm.reset();
        this.showSuccess();
      }
    });
  }

  saveNotificaciones(): void {
    const userId = this.getUserId();
    if (!userId) return;

    const formValue = this.notificacionesForm.value;
    this.userStore.updateNotificationPreferences(userId, {
      email: !!formValue.email,
      push: !!formValue.push,
      mensajes: !!formValue.mensajes,
      comentarios: !!formValue.ofertas,
      vacantes: !!formValue.ofertas,
    }).pipe(
      catchError(err => {
        this.handleError(err);
        return of(null);
      })
    ).subscribe(result => {
      if (result) this.showSuccess();
    });
  }
}
