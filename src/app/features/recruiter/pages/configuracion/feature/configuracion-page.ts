import { Component, ElementRef, ViewChild, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { UserStore } from '@features/users/data-access/state/user.store';
import { RECRUITER_PROFILE_REPOSITORY, RecruiterProfileRepository } from '@features/recruiter/pages/profile/domain/ports/recruiter-profile.repository';
import { AuthStore } from '@features/auth/data-access/state/auth.store';
import { ToastService } from '@core/services/toast.service';
import { catchError, of } from 'rxjs';
import { User } from '@core/domain/models/user.model';
import { ConfigCategory } from '@features/recruiter/pages/configuracion/domain/models/config.models';
import { CompanyStore } from '@features/recruiter/pages/company/data-access/state/company.store';
import { Company } from '@features/recruiter/pages/company/domain/models/company.model';
import { COUNTRIES, Country } from '@shared/constants/countries';
import { SECTORS } from '@shared/constants/sectors';
import { ImageEditorService } from '@core/services/image-editor.service';
import { UploadService } from '@core/services/upload.service';

@Component({
  selector: 'app-configuracion-page',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.scss',
})
export class ConfiguracionPage implements OnInit {
  private fb = inject(FormBuilder);
  private userStore = inject(UserStore);
  private recruiterService = inject<RecruiterProfileRepository>(RECRUITER_PROFILE_REPOSITORY);
  private authStore = inject(AuthStore);
  private companyStore = inject(CompanyStore);
  private route = inject(ActivatedRoute);
  private imageEditor = inject(ImageEditorService);
  private uploadService = inject(UploadService);

  @ViewChild('logoFileInput') logoFileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('bannerFileInput') bannerFileInput?: ElementRef<HTMLInputElement>;

  uploadingImage = signal(false);

  userData = signal<User | null>(null);
  profileId = signal<string | null>(null);
  /** Empresa del reclutador; null si aún no creó ninguna. */
  empresa = signal<Company | null>(null);

  readonly countries: Country[] = COUNTRIES;
  readonly sectors: string[] = SECTORS;

  activeSection = signal('perfil-personal');
  expandedCategory = signal<string | null>('perfil');
  loading = signal(false);

  private toast = inject(ToastService);

  categories: ConfigCategory[] = [
    {
      id: 'perfil',
      icon: 'person',
      label: 'Perfil',
      subItems: [
        { id: 'perfil-personal', icon: 'badge', label: 'Información personal' },
        { id: 'perfil-profesional', icon: 'work', label: 'Perfil profesional' },
        { id: 'perfil-redes', icon: 'public', label: 'Redes sociales' },
        { id: 'perfil-descripcion', icon: 'description', label: 'Descripción' },
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
    {
      id: 'empresa',
      icon: 'apartment',
      label: 'Empresa',
      subItems: [
        { id: 'empresa-datos', icon: 'domain', label: 'Datos de la empresa' },
        { id: 'empresa-redes', icon: 'public', label: 'Redes sociales' },
        { id: 'empresa-estado', icon: 'verified', label: 'Estado y verificación' },
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
  });

  /**
   * Sin teléfono, sitio web, RUC, fecha de creación ni "Empresas": son datos
   * de la organización y viven en Company. Al ser reclutador = empresa, el
   * perfil personal solo conserva lo que es de la persona.
   */
  profesionalForm = this.fb.group({
    especializacion: [''],
    lema: [''],
  });

  /** Igual que con LinkedIn: las redes de la empresa van en Empresa. */
  redesForm = this.fb.group({
    instagram: [''],
    tiktok: [''],
    facebook: [''],
  });

  descripcionForm = this.fb.group({
    bio: [''],
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
    candidatos: [true],
  });

  empresaForm = this.fb.group({
    nombre: [''],
    sector: [''],
    descripcion: [''],
    ruc: [''],
    fechaCreacion: [''],
    contactoEmail: [''],
    contactoTelefono: [''],
    pais: [''],
    ciudad: [''],
    distrito: [''],
    direccion: [''],
    logoUrl: [''],
    bannerUrl: [''],
  });

  /**
   * Enlaces de la organización. Sin GitHub: una empresa no publica código,
   * eso lo tiene el perfil del developer.
   */
  empresaRedesForm = this.fb.group({
    sitioWeb: [''],
    linkedin: [''],
  });

  ngOnInit(): void {
    this.loadUserData();
    this.loadProfileData();
    this.loadEmpresa();

    // Permite llegar directo a una sección: /configuracion?section=empresa-datos
    const section = this.route.snapshot.queryParamMap.get('section');
    if (section) {
      this.selectSubItem(section);
    }
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
          } as any);
          this.descripcionForm.patchValue({
            bio: user.bio ?? '',
          } as any);
          this.privacidadForm.patchValue({
            perfilPublico: user.perfilPublico !== false,
          } as any);
        }
      },
      error: () => {
        // Silently fail
      }
    });
  }

  /** Guarda la visibilidad del perfil (público/privado). */
  onSubmitPrivacidad(): void {
    const userId = this.getUserId();
    if (!userId) return;

    const esPublico = this.privacidadForm.value.perfilPublico !== false;
    this.userStore.update(userId, { perfilPublico: esPublico }).subscribe({
      next: (updated: User) => {
        this.userData.set(updated);
        this.toast.success(esPublico ? 'Perfil público: cualquiera puede verlo' : 'Perfil privado: solo conexiones aceptadas');
      },
      error: () => this.toast.error('No se pudo actualizar la visibilidad'),
    });
  }

  private loadProfileData(): void {
    const userId = this.getUserId();
    if (!userId) return;

    this.recruiterService.getByUserId(userId).subscribe({
      next: (profile: any) => {
        if (profile) {
          this.profileId.set(profile.id);
          this.profesionalForm.patchValue({
            especializacion: profile.cargo ?? '',
            lema: profile.lema ?? '',
          } as any);
          this.redesForm.patchValue({
            instagram: profile.redesSociales?.instagram ?? '',
            tiktok: profile.redesSociales?.tiktok ?? '',
            facebook: profile.redesSociales?.facebook ?? '',
          } as any);
        }
      },
      error: () => {
        // Silently fail - profile might not exist yet
      }
    });
  }

  private loadEmpresa(): void {
    const recruiterId = this.getUserId();
    if (!recruiterId) return;

    this.companyStore.loadMyCompany(recruiterId).subscribe({
      next: company => {
        this.empresa.set(company);
        if (company) {
          this.empresaForm.patchValue({
            nombre: company.nombre ?? '',
            sector: company.sector ?? '',
            descripcion: company.descripcion ?? '',
            ruc: company.ruc ?? '',
            fechaCreacion: company.fechaCreacion ?? '',
            contactoEmail: company.contacto?.email ?? '',
            contactoTelefono: company.contacto?.telefono ?? '',
            pais: company.ubicacion?.pais ?? '',
            ciudad: company.ubicacion?.ciudad ?? '',
            distrito: company.ubicacion?.distrito ?? '',
            direccion: company.ubicacion?.direccion ?? '',
            logoUrl: company.logoUrl ?? '',
            bannerUrl: company.bannerUrl ?? '',
          });
          this.empresaRedesForm.patchValue({
            sitioWeb: company.sitioWeb ?? '',
            linkedin: company.redes?.linkedin ?? '',
          });
        }
      },
      error: () => this.empresa.set(null),
    });
  }

  saveEmpresa(): void {
    // Las redes no se tocan aquí: eso lo guarda su propia sección.
    this.guardarEmpresa(this.empresa()?.sitioWeb ?? '', this.empresa()?.redes?.linkedin ?? '');
  }

  saveEmpresaRedes(): void {
    const v = this.empresaRedesForm.value;
    this.guardarEmpresa(v.sitioWeb?.trim() ?? '', v.linkedin?.trim() ?? '');
  }

  /**
   * Guardado único de la empresa. El formulario de datos no envía las redes y
   * el de redes no envía los datos; los dos pasan lo que no manejan, porque
   * el backend reemplaza los campos que recibe y vaciaría los demás.
   */
  private guardarEmpresa(sitioWeb: string, linkedin: string): void {
    const recruiterId = this.getUserId();
    if (!recruiterId) return;

    const v = this.empresaForm.value;
    if (!v.nombre?.trim()) {
      this.toast.error('La empresa necesita nombre');
      return;
    }
    if (!v.contactoEmail?.trim()) {
      this.toast.error('La empresa necesita correo de contacto');
      return;
    }
    if (!v.pais?.trim()) {
      this.toast.error('La empresa necesita país');
      return;
    }

    this.companyStore
      .save(recruiterId, this.empresa()?.id ?? null, {
        nombre: v.nombre.trim(),
        descripcion: v.descripcion?.trim() || undefined,
        sector: v.sector?.trim() || undefined,
        sitioWeb: sitioWeb || undefined,
        logoUrl: v.logoUrl?.trim() || undefined,
        bannerUrl: v.bannerUrl?.trim() || undefined,
        ruc: v.ruc?.trim() || undefined,
        fechaCreacion: v.fechaCreacion?.trim() || undefined,
        ubicacion: {
          pais: v.pais.trim(),
          ciudad: v.ciudad?.trim() ?? '',
          distrito: v.distrito?.trim() ?? '',
          direccion: v.direccion?.trim() ?? '',
        },
        contacto: {
          email: v.contactoEmail.trim(),
          telefono: v.contactoTelefono?.trim() ?? '',
        },
        redes: { linkedin },
      })
      .subscribe({
        next: () => this.toast.success('Empresa guardada'),
        error: () => this.toast.error('No se pudo guardar la empresa'),
      });
  }

  pickEmpresaImagen(campo: 'logoUrl' | 'bannerUrl'): void {
    (campo === 'logoUrl' ? this.logoFileInput : this.bannerFileInput)?.nativeElement.click();
  }

  onEmpresaImagenSelected(event: Event, campo: 'logoUrl' | 'bannerUrl'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) void this.uploadEmpresaImagen(file, campo);
  }

  /**
   * Recorta con el editor compartido y sube al mismo endpoint que usa el
   * perfil de usuario. El campo sigue guardando la URL resultante.
   */
  private async uploadEmpresaImagen(file: File, campo: 'logoUrl' | 'bannerUrl'): Promise<void> {
    const esBanner = campo === 'bannerUrl';
    const edited = await this.imageEditor.open(file, {
      aspect: esBanner ? 16 / 9 : 1,
      aspectLabel: esBanner ? '16:9 Banner' : '1:1 Logo',
      maxSide: esBanner ? 1920 : 512,
      title: esBanner ? 'Editar banner de la empresa' : 'Editar logo de la empresa',
      quality: esBanner ? 0.85 : 0.9,
    });
    if (!edited) return;

    this.uploadingImage.set(true);
    this.uploadService.uploadFile(edited).subscribe({
      next: res => {
        this.empresaForm.get(campo)?.setValue(res.url);
        this.uploadingImage.set(false);
        this.toast.success(esBanner ? 'Banner actualizado' : 'Logo actualizado');
      },
      error: () => {
        this.uploadingImage.set(false);
        this.toast.error('No se pudo subir la imagen');
      },
    });
  }

  estadoEmpresaLabel(): string {
    const estados: Record<string, string> = {
      PENDIENTE: 'Pendiente de verificación',
      VERIFICADA: 'Verificada',
      RECHAZADA: 'Rechazada',
    };
    const estado = this.empresa()?.estadoVerificacion;
    return estado ? (estados[estado] ?? estado) : '';
  }

  estadoEmpresaClass(): string {
    const clases: Record<string, string> = {
      PENDIENTE: 'pending',
      VERIFICADA: 'verified',
      RECHAZADA: 'rejected',
    };
    const estado = this.empresa()?.estadoVerificacion;
    return estado ? (clases[estado] ?? '') : '';
  }

  toggleCategory(id: string): void {
    if (this.expandedCategory() === id) {
      this.expandedCategory.set(null);
    } else {
      this.expandedCategory.set(id);
    }
  }

  selectSubItem(id: string): void {
    if (this.activeSection() === id) return;
    this.loading.set(true);
    this.activeSection.set(id);
    // Al llegar por enlace directo (?section=) hay que abrir la categoría contenedora.
    const parent = this.categories.find(cat => cat.subItems.some(sub => sub.id === id));
    if (parent) this.expandedCategory.set(parent.id);
    setTimeout(() => this.loading.set(false), 300);
  }

  private showSuccess(): void {
    this.toast.success('Cambios guardados');
  }

  private handleError(err: any): void {
    this.toast.error('Error al guardar: ' + (err?.message || 'Intente de nuevo'));
  }

  // ─── SAVE METHODS ───

  savePerfil(): void {
    const userId = this.getUserId();
    if (!userId) return;

    const formValue = this.perfilForm.value;
    this.userStore.update(userId, {
      nombre: formValue.nombre ?? undefined,
      email: formValue.email ?? undefined,
    } as any).pipe(
      catchError(err => {
        this.handleError(err);
        return of(null);
      })
    ).subscribe((result: any) => {
      if (result) this.showSuccess();
    });
  }

  saveProfesional(): void {
    const userId = this.getUserId();
    if (!userId) return;

    const formValue = this.profesionalForm.value;
    const payload = {
      cargo: formValue.especializacion ?? undefined,
      lema: formValue.lema ?? undefined,
    };

    const profileId = this.profileId();
    if (profileId) {
      // Update existing profile
      this.recruiterService.update(profileId, payload as any).pipe(
        catchError(err => {
          this.handleError(err);
          return of(null);
        })
      ).subscribe((result: any) => {
        if (result) this.showSuccess();
      });
    } else {
      // Create profile if it doesn't exist
      this.recruiterService.create({
        userId,
        ...payload,
      } as any).pipe(
        catchError(err => {
          this.handleError(err);
          return of(null);
        })
      ).subscribe((result: any) => {
        if (result) {
          this.profileId.set(result.id);
          this.showSuccess();
        }
      });
    }
  }

  saveRedes(): void {
    const userId = this.getUserId();
    if (!userId) return;

    const formValue = this.redesForm.value;
    // Sin linkedin: el backend reemplaza el objeto completo, así que al no
    // enviarlo se limpia el LinkedIn personal que pudiera quedar guardado.
    const redesPayload = {
      instagram: formValue.instagram ?? undefined,
      tiktok: formValue.tiktok ?? undefined,
      facebook: formValue.facebook ?? undefined,
    };

    const profileId = this.profileId();
    if (profileId) {
      this.recruiterService.update(profileId, {
        redesSociales: redesPayload,
      } as any).pipe(
        catchError(err => {
          this.handleError(err);
          return of(null);
        })
      ).subscribe((result: any) => {
        if (result) this.showSuccess();
      });
    } else {
      // Crear perfil si no existe, incluyendo las redes sociales
      this.recruiterService.create({
        userId,
        redesSociales: redesPayload,
      } as any).pipe(
        catchError(err => {
          this.handleError(err);
          return of(null);
        })
      ).subscribe((profileResult: any) => {
        if (profileResult) {
          this.profileId.set(profileResult.id);
          this.showSuccess();
        }
      });
    }
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

    const formValue = this.descripcionForm.value;
    const bioValue = formValue.bio?.trim();

    if (!bioValue) {
      this.savingBio.set(false);
      this.toast.warning('La bio no puede estar vacía');
      return;
    }

    this.userStore.update(userId, {
      bio: bioValue,
    } as any).pipe(
      catchError(err => {
        this.savingBio.set(false);
        this.handleError(err);
        return of(null);
      })
    ).subscribe((result: any) => {
      this.savingBio.set(false);
      if (result) {
        this.showSuccess();
      } else {
        this.toast.error('No se pudo guardar la bio');
      }
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
    ).subscribe((result: any) => {
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
      comentarios: !!formValue.candidatos, // mapeamos candidatos a comentarios/vacantes
      vacantes: !!formValue.candidatos,
    }).pipe(
      catchError(err => {
        this.handleError(err);
        return of(null);
      })
    ).subscribe((result: any) => {
      if (result) this.showSuccess();
    });
  }
}
