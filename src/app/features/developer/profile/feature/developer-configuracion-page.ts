import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { UserStore } from '@features/users/data-access/state/user.store';
import { AuthStore } from '@features/auth/data-access/state/auth.store';
import { DeveloperProfileStore } from '@features/developer/profile/data-access/state/developer-profile.store';
import { ToastService } from '@core/services/toast.service';
import { UploadService } from '@core/services/upload.service';
import { catchError, of } from 'rxjs';
import { User, DeveloperProfile } from '@core/domain/models/user.model';
import { PERU_DEPARTAMENTOS } from '@shared/constants/peru-departments';
import { TagInputComponent } from '@shared/ui/tag-input/tag-input';

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
  imports: [ReactiveFormsModule, TagInputComponent],
  templateUrl: './developer-configuracion.html',
  styleUrl: './developer-configuracion.scss',
})
export class DeveloperConfiguracionPage implements OnInit {
  private fb = inject(FormBuilder);
  private userStore = inject(UserStore);
  private authStore = inject(AuthStore);
  private profileStore = inject(DeveloperProfileStore);
  private toast = inject(ToastService);
  private uploadService = inject(UploadService);

  userData = signal<User | null>(null);
  profileData = signal<DeveloperProfile | null>(null);
  profileId = signal<string | null>(null);
  activeSection = signal('perfil-personal');
  expandedCategory = signal<string | null>('perfil');
  loading = signal(false);

  readonly departamentos: string[] = PERU_DEPARTAMENTOS;

  categories: ConfigCategory[] = [
    {
      id: 'perfil',
      icon: 'person',
      label: 'Perfil',
      subItems: [
        { id: 'perfil-personal', icon: 'badge', label: 'Información personal' },
        { id: 'perfil-profesional', icon: 'code', label: 'Perfil profesional' },
        { id: 'perfil-enlaces', icon: 'public', label: 'Enlaces' },
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

  // CV en PDF: se sube al cargarlo y su URL viaja junto al perfil al guardar
  cvUrl = signal('');
  cvNombre = signal('');
  cvSubiendo = signal(false);

  profesionalForm = this.fb.group({
    tituloProfesional: [''],
    habilidadesBlandas: [[] as string[]],
    buscandoEmpleo: [false],
  });

  enlacesForm = this.fb.group({
    github: [''],
    linkedin: [''],
    portafolio: [''],
    sitioWeb: [''],
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
    this.loadProfileData();
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
          this.enlacesForm.patchValue({
            sitioWeb: user.sitioWeb ?? '',
          } as never);
          // Carga la visibilidad real del perfil (público/privado)
          this.privacidadForm.patchValue({
            perfilPublico: user.perfilPublico !== false,
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
          if (user.developerProfile) {
            this.profileData.set(user.developerProfile);
            this.profileId.set(user.developerProfile.id);
            this.patchProfileForms(user.developerProfile);
          }
        }
      },
      error: () => {},
    });
  }

  private loadProfileData(): void {
    const userId = this.getUserId();
    if (!userId) return;

    this.profileStore.loadByUserId(userId);
    const interval = setInterval(() => {
      const profile = this.profileStore.profile();
      if (profile) {
        this.profileData.set(profile);
        this.profileId.set(profile.id);
        this.patchProfileForms(profile);
        clearInterval(interval);
      } else if (!this.profileStore.loading()) {
        clearInterval(interval);
      }
    }, 100);
    setTimeout(() => clearInterval(interval), 5000);
  }

  private patchProfileForms(profile: DeveloperProfile): void {
    this.profesionalForm.patchValue({
      tituloProfesional: profile.tituloProfesional ?? '',
      habilidadesBlandas: profile.habilidadesBlandas ?? [],
      buscandoEmpleo: profile.disponibilidadLaboral?.buscandoEmpleo ?? false,
    });
    //el CV actual (si existe) se muestra en la sección profesional
    this.cvUrl.set(profile.cv?.archivoUrl ?? '');
    this.cvNombre.set(profile.cv?.nombreArchivo ?? '');
    this.enlacesForm.patchValue({
      github: profile.enlaces?.github ?? '',
      linkedin: profile.enlaces?.linkedin ?? '',
      portafolio: profile.enlaces?.portafolio ?? '',
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

  saveProfesional(): void {
    const userId = this.getUserId();
    if (!userId) return;

    const formValue = this.profesionalForm.value;
    const payload = {
      tituloProfesional: formValue.tituloProfesional ?? undefined,
      habilidadesBlandas: formValue.habilidadesBlandas ?? [],
      disponibilidadLaboral: {
        buscandoEmpleo: !!formValue.buscandoEmpleo,
        modalidades: this.profileData()?.disponibilidadLaboral?.modalidades ?? [],
        tiposContrato: this.profileData()?.disponibilidadLaboral?.tiposContrato ?? [],
      },
      //si se cargó un CV, su URL pública viaja con el perfil; si se quitó, se envía vacío para limpiarlo
      ...(this.cvUrl()
        ? {
            cv: {
              archivoUrl: this.cvUrl(),
              nombreArchivo: this.cvNombre(),
              actualizadoEn: new Date().toISOString(),
            },
          }
        : { cv: {} }),
    };

    const profileId = this.profileId();
    if (profileId) {
      this.profileStore.update(profileId, payload);
      this.showSuccess();
    } else {
      this.profileStore.create({ userId, ...payload });
      this.showSuccess();
    }
  }

  //el PDF se sube al elegirlo (Cloudinary vía backend); "Guardar cambios" guarda la URL
  onCvSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf') || file.type !== 'application/pdf') {
      this.toast.error('El CV debe ser un archivo PDF');
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.toast.error('El CV no puede superar los 5 MB');
      input.value = '';
      return;
    }
    this.cvSubiendo.set(true);
    this.uploadService.uploadFile(file).subscribe({
      next: (res) => {
        this.cvUrl.set(res.url ?? '');
        this.cvNombre.set(file.name);
        this.cvSubiendo.set(false);
        this.toast.success('CV subido. Guarda los cambios para completar.');
      },
      error: () => {
        this.cvSubiendo.set(false);
        this.toast.error('No se pudo subir el CV');
      },
    });
  }

  //quita el CV del formulario (y del perfil al guardar cambios)
  removeCv(input?: HTMLInputElement): void {
    this.cvUrl.set('');
    this.cvNombre.set('');
    if (input) input.value = '';
    this.toast.info('CV quitado. Guarda los cambios para confirmar.');
  }

  saveEnlaces(): void {
    const userId = this.getUserId();
    if (!userId) return;

    const formValue = this.enlacesForm.value;

    this.userStore.update(userId, {
      sitioWeb: formValue.sitioWeb ?? undefined,
    } as never).pipe(
      catchError(err => {
        this.handleError(err);
        return of(null);
      })
    ).subscribe(userResult => {
      if (!userResult) return;

      const profilePayload = {
        enlaces: {
          github: formValue.github ?? undefined,
          linkedin: formValue.linkedin ?? undefined,
          portafolio: formValue.portafolio ?? undefined,
        },
      };

      const profileId = this.profileId();
      if (profileId) {
        this.profileStore.update(profileId, profilePayload);
        this.showSuccess();
      } else {
        this.profileStore.create({ userId, ...profilePayload });
        this.showSuccess();
      }
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

  /** Guarda la visibilidad del perfil (público/privado). */
  savePrivacidad(): void {
    const userId = this.getUserId();
    if (!userId) return;

    const esPublico = this.privacidadForm.value.perfilPublico !== false;
    this.userStore.update(userId, { perfilPublico: esPublico }).pipe(
      catchError(err => {
        this.handleError(err);
        return of(null);
      })
    ).subscribe(updated => {
      if (!updated) return;
      this.userData.set(updated);
      this.toast.success(
        esPublico ? 'Perfil público: cualquiera puede verlo' : 'Perfil privado: solo conexiones aceptadas'
      );
    });
  }
}
