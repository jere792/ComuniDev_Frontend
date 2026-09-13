import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { GraphQLService } from '../../../../../core/services/graphql.service';
import { RecruiterProfileGraphqlService } from '../../data-access/api/recruiter-profile-graphql.service';
import { AuthStore } from '../../../../auth/data-access/state/auth.store';
import { catchError, of, tap } from 'rxjs';
import { User } from '../../../../../core/domain/models/user.model';

interface SubItem {
  id: string;
  icon: string;
  label: string;
}

interface ConfigCategory {
  id: string;
  icon: string;
  label: string;
  subItems: SubItem[];
  comingSoon?: boolean;
}

@Component({
  selector: 'app-configuracion-page',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.scss',
})
export class ConfiguracionPage implements OnInit {
  private fb = inject(FormBuilder);
  private graphql = inject(GraphQLService);
  private recruiterService = inject(RecruiterProfileGraphqlService);
  private authStore = inject(AuthStore);

  userData = signal<User | null>(null);
  profileId = signal<string | null>(null);

  activeSection = signal('perfil-personal');
  expandedCategory = signal<string | null>('perfil');
  saved = signal(false);
  saveError = signal<string | null>(null);
  loading = signal(false);

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

  profesionalForm = this.fb.group({
    especializacion: [''],
    lema: [''],
    empresas: [''],
    ruc: [''],
    fechaCreacion: [''],
  });

  redesForm = this.fb.group({
    sitioWeb: [''],
    linkedin: [''],
    instagram: [''],
    tiktok: [''],
    facebook: [''],
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
    candidatos: [true],
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

    this.graphql.getUser(userId).subscribe({
      next: (user: User | null) => {
        if (user) {
          this.userData.set(user);
          this.perfilForm.patchValue({
            nombre: user.nombre ?? '',
            email: user.email ?? '',
            telefono: user.telefono ?? '',
          } as any);
          this.descripcionForm.patchValue({
            bio: user.bio ?? '',
          } as any);
          this.redesForm.patchValue({
            sitioWeb: user.sitioWeb ?? '',
          } as any);
          if (user.ubicacion) {
            this.ubicacionForm.patchValue({
              pais: user.ubicacion.pais ?? 'Perú',
              departamento: user.ubicacion.departamento ?? '',
              provincia: user.ubicacion.provincia ?? '',
              ciudad: user.ubicacion.ciudad ?? '',
              distrito: user.ubicacion.distrito ?? '',
              direccion: user.ubicacion.direccion ?? '',
            } as any);
          }
        }
      },
      error: () => {
        // Silently fail
      }
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
            empresas: profile.empresasDescripcion ?? '',
            ruc: profile.ruc ?? '',
            fechaCreacion: profile.fechaCreacion ?? '',
          } as any);
          this.redesForm.patchValue({
            linkedin: profile.redesSociales?.linkedin ?? '',
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
    this.saved.set(false);
    this.saveError.set(null);
    setTimeout(() => this.loading.set(false), 300);
  }

  private showSuccess(): void {
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2000);
  }

  private handleError(err: any): void {
    this.saveError.set('Error al guardar: ' + (err?.message || 'Intente de nuevo'));
    setTimeout(() => this.saveError.set(null), 3000);
  }

  // ─── SAVE METHODS ───

  savePerfil(): void {
    const userId = this.getUserId();
    if (!userId) return;

    const formValue = this.perfilForm.value;
    this.graphql.updateUser(userId, {
      nombre: formValue.nombre ?? undefined,
      email: formValue.email ?? undefined,
      telefono: formValue.telefono ?? undefined,
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
      empresasDescripcion: formValue.empresas ?? undefined,
      ruc: formValue.ruc ?? undefined,
      fechaCreacion: formValue.fechaCreacion ?? undefined,
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
    const redesPayload = {
      linkedin: formValue.linkedin ?? undefined,
      instagram: formValue.instagram ?? undefined,
      tiktok: formValue.tiktok ?? undefined,
      facebook: formValue.facebook ?? undefined,
    };

    // Guardar sitioWeb en User
    this.graphql.updateUser(userId, {
      sitioWeb: formValue.sitioWeb ?? undefined,
    } as any).pipe(
      catchError(err => {
        this.handleError(err);
        return of(null);
      })
    ).subscribe((userResult: any) => {
      if (!userResult) return;

      // Guardar redes sociales en RecruiterProfile
      const profileId = this.profileId();
      if (profileId) {
        this.recruiterService.update(profileId, {
          redesSociales: redesPayload,
        } as any).pipe(
          catchError(err => {
            this.handleError(err);
            return of(null);
          })
        ).subscribe((profileResult: any) => {
          if (profileResult || userResult) this.showSuccess();
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
    });
  }

  savingBio = signal(false);

  saveBio(): void {
    console.log('>>> saveBio() clicked');
    this.saveError.set(null);
    this.saved.set(false);
    this.savingBio.set(true);
    
    const userId = this.getUserId();
    console.log('>>> userId:', userId);
    
    if (!userId) {
      this.savingBio.set(false);
      this.saveError.set('Error: Usuario no identificado');
      return;
    }

    const formValue = this.descripcionForm.value;
    const bioValue = formValue.bio?.trim();
    console.log('>>> bioValue:', bioValue);
    
    if (!bioValue) {
      this.savingBio.set(false);
      this.saveError.set('La bio no puede estar vacía');
      return;
    }
    
    this.graphql.updateUser(userId, {
      bio: bioValue,
    } as any).pipe(
      catchError(err => {
        this.savingBio.set(false);
        console.error('>>> saveBio error:', err);
        this.handleError(err);
        return of(null);
      })
    ).subscribe((result: any) => {
      this.savingBio.set(false);
      console.log('>>> saveBio result:', result);
      if (result) {
        this.showSuccess();
      } else {
        this.saveError.set('No se pudo guardar la bio');
      }
    });
  }

  saveUbicacion(): void {
    const userId = this.getUserId();
    if (!userId) return;

    const formValue = this.ubicacionForm.value;
    this.graphql.updateUser(userId, {
      ubicacion: {
        pais: formValue.pais ?? undefined,
        departamento: formValue.departamento ?? undefined,
        provincia: formValue.provincia ?? undefined,
        ciudad: formValue.ciudad ?? undefined,
        distrito: formValue.distrito ?? undefined,
        direccion: formValue.direccion ?? undefined,
      },
    } as any).pipe(
      catchError(err => {
        this.handleError(err);
        return of(null);
      })
    ).subscribe((result: any) => {
      if (result) this.showSuccess();
    });
  }

  saveContrasena(): void {
    const userId = this.getUserId();
    if (!userId) return;

    const formValue = this.contrasenaForm.value;
    if (!formValue.actual || !formValue.nueva || !formValue.confirmar) {
      this.saveError.set('Todos los campos son requeridos');
      return;
    }

    if (formValue.nueva !== formValue.confirmar) {
      this.saveError.set('Las contraseñas no coinciden');
      return;
    }

    if (formValue.nueva.length < 6) {
      this.saveError.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.graphql.changePassword(userId, formValue.actual, formValue.nueva).pipe(
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
    this.graphql.updateNotificationPreferences(userId, {
      email: formValue.email,
      push: formValue.push,
      mensajes: formValue.mensajes,
      comentarios: formValue.candidatos, // mapeamos candidatos a comentarios/vacantes
      vacantes: formValue.candidatos,
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
