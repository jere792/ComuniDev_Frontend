import { Component, OnInit, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { User, DeveloperProfile } from '@core/domain/models/user.model';
import { DeveloperProfileStore } from '@features/developer/profile/data-access/state/developer-profile.store';
import { UserStore } from '@features/users/data-access/state/user.store';
import { ToastService } from '@core/services/toast.service';
import { ImageEditorService } from '@core/services/image-editor.service';
import { DeveloperProfileCard } from '@features/developer/profile/ui/profile-card/developer-profile-card';
import { DeveloperContactInfo } from '@features/developer/profile/ui/contact-info/developer-contact-info';
import { DeveloperStackCard } from '@features/developer/profile/ui/stack-card/developer-stack-card';
import { SidebarCard } from '@features/recruiter/pages/profile/ui/sidebar-card/sidebar-card';
import { SocialListModal, SocialListType } from '@features/recruiter/pages/profile/ui/social-list-modal/social-list-modal';

@Component({
  selector: 'app-developer-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    DeveloperProfileCard,
    DeveloperContactInfo,
    DeveloperStackCard,
    SidebarCard,
    SocialListModal,
  ],
  templateUrl: './developer-profile.html',
  styleUrl: './developer-profile.scss',
})
export class DeveloperProfilePage implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(DeveloperProfileStore);
  private userStore = inject(UserStore);

  user = signal<User | null>(null);
  isEditingBasic = signal(false);
  isEditingProfile = signal(false);
  uploadingImage = signal(false);
  socialModalOpen = signal(false);
  socialModalType = signal<SocialListType>('followers');
  basicForm: FormGroup;
  profileForm: FormGroup;

  private toast = inject(ToastService);
  private imageEditor = inject(ImageEditorService);

  constructor() {
    this.basicForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      nombreUsuario: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      bio: [''],
      telefono: [''],
      ubicacionPais: [''],
      ubicacionCiudad: [''],
      ubicacionDistrito: [''],
    });

    this.profileForm = this.fb.group({
      tituloProfesional: [''],
      github: [''],
      linkedin: [''],
      portafolio: [''],
      buscandoEmpleo: [false],
      tecnologias: this.fb.array([]),
      habilidadesBlandas: [''],
    });

    effect(() => {
      const err = this.store.error();
      if (err) this.toast.error(err);
    });
  }

  get profile(): DeveloperProfile | null {
    return this.store.profile();
  }

  get loading(): boolean {
    return this.store.loading();
  }

  get hasProfile(): boolean {
    return this.store.hasProfile();
  }

  get tecnologias(): FormArray {
    return this.profileForm.get('tecnologias') as FormArray;
  }

  ngOnInit(): void {
    this.loadUser();
  }

  loadUser(): void {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    this.userStore.getById(userId).subscribe({
      next: (user: User | null) => {
        this.user.set(user);
        if (user?.developerProfile) {
          this.store.profile.set(user.developerProfile);
          this.populateProfileForm(user.developerProfile);
        }
      },
      error: () => {},
    });
  }

  populateProfileForm(profile: DeveloperProfile): void {
    this.profileForm.patchValue({
      tituloProfesional: profile.tituloProfesional || '',
      github: profile.enlaces?.github || '',
      linkedin: profile.enlaces?.linkedin || '',
      portafolio: profile.enlaces?.portafolio || '',
      buscandoEmpleo: profile.disponibilidadLaboral?.buscandoEmpleo || false,
      habilidadesBlandas: profile.habilidadesBlandas?.join(', ') || '',
    });
    this.tecnologias.clear();
    profile.tecnologias?.forEach((tech: { nombre: string; nivel: string; aniosExperiencia: number }) => {
      this.tecnologias.push(this.fb.group({
        nombre: [tech.nombre, Validators.required],
        nivel: [tech.nivel],
        aniosExperiencia: [tech.aniosExperiencia],
      }));
    });
  }

  toggleEditBasic(): void {
    this.isEditingProfile.set(false);
    this.isEditingBasic.update(v => !v);
    if (this.isEditingBasic() && this.user()) {
      const u = this.user()!;
      this.basicForm.patchValue({
        nombre: u.nombre,
        nombreUsuario: u.nombreUsuario,
        email: u.email,
        bio: u.bio || '',
        telefono: u.telefono || '',
        ubicacionPais: u.ubicacion?.pais || '',
        ubicacionCiudad: u.ubicacion?.ciudad || '',
        ubicacionDistrito: u.ubicacion?.distrito || '',
      });
    }
  }

  toggleEditProfile(): void {
    this.isEditingBasic.set(false);
    this.isEditingProfile.update(v => !v);
    if (this.isEditingProfile() && this.profile) {
      this.populateProfileForm(this.profile);
    }
  }

  addTecnologia(): void {
    this.tecnologias.push(this.fb.group({
      nombre: ['', Validators.required],
      nivel: ['INTERMEDIO'],
      aniosExperiencia: [0],
    }));
  }

  removeTecnologia(index: number): void {
    this.tecnologias.removeAt(index);
  }

  onSubmitBasic(): void {
    if (this.basicForm.valid && this.user()) {
      const formValue = this.basicForm.value;
      const payload = {
        nombre: formValue.nombre,
        nombreUsuario: formValue.nombreUsuario,
        email: formValue.email,
        bio: formValue.bio,
        telefono: formValue.telefono,
        ubicacion: {
          pais: formValue.ubicacionPais,
          ciudad: formValue.ubicacionCiudad,
          distrito: formValue.ubicacionDistrito,
        },
      };
      this.userStore.update(this.user()!.id, payload as Partial<User>).subscribe({
        next: (updatedUser: User) => {
          this.user.set(updatedUser);
          localStorage.setItem('userName', updatedUser.nombre);
          this.isEditingBasic.set(false);
          this.toast.success('Datos básicos actualizados');
        },
      });
    }
  }

  onSubmitProfile(): void {
    const userId = this.user()?.id;
    if (!userId) return;

    const formValue = this.profileForm.value;
    const profileData = {
      tituloProfesional: formValue.tituloProfesional,
      tecnologias: formValue.tecnologias,
      habilidadesBlandas: formValue.habilidadesBlandas?.split(',').map((s: string) => s.trim()).filter(Boolean),
      enlaces: {
        github: formValue.github,
        linkedin: formValue.linkedin,
        portafolio: formValue.portafolio,
      },
      disponibilidadLaboral: {
        buscandoEmpleo: formValue.buscandoEmpleo,
        modalidades: [],
        tiposContrato: [],
      },
    };

    if (this.profile) {
      this.store.update(this.profile.id, profileData);
    } else {
      this.store.create({ userId, ...profileData });
    }

    this.isEditingProfile.set(false);
    this.toast.success('Perfil profesional actualizado');
  }

  getInitials(): string {
    const name = this.user()?.nombre || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  openSocialModal(type: SocialListType): void {
    this.socialModalType.set(type);
    this.socialModalOpen.set(true);
  }

  closeSocialModal(): void {
    this.socialModalOpen.set(false);
  }

  onBannerClick(input: HTMLInputElement): void {
    input.click();
  }

  onPhotoClick(input: HTMLInputElement): void {
    input.click();
  }

  onBannerSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadImage(file, 'bannerUrl');
    input.value = '';
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadImage(file, 'fotoPerfilUrl');
    input.value = '';
  }

  private async uploadImage(file: File, field: 'bannerUrl' | 'fotoPerfilUrl'): Promise<void> {
    const isBanner = field === 'bannerUrl';
    const edited = await this.imageEditor.open(file, {
      aspect: isBanner ? 16 / 9 : 1,
      aspectLabel: isBanner ? '16:9 Banner' : '1:1 Avatar',
      maxSide: isBanner ? 1920 : 512,
      title: isBanner ? 'Editar banner' : 'Editar foto de perfil',
      quality: isBanner ? 0.85 : 0.9,
    });
    if (!edited) return;

    this.uploadingImage.set(true);
    this.userStore.uploadFile(edited).subscribe({
      next: (res: { url: string }) => {
        const userId = this.user()?.id;
        if (!userId) return;
        this.userStore.update(userId, { [field]: res.url }).subscribe({
          next: (updatedUser: User) => {
            this.user.set(updatedUser);
            if (field === 'fotoPerfilUrl') localStorage.setItem('userPhoto', res.url);
            this.uploadingImage.set(false);
            this.toast.success(isBanner ? 'Banner actualizado' : 'Foto de perfil actualizada');
          },
        });
      },
      error: () => {
        this.uploadingImage.set(false);
        this.toast.error('Error al subir imagen');
      },
    });
  }
}
