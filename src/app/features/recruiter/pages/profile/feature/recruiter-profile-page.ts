import { Component, OnInit, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { User, RecruiterProfile } from '@core/domain/models/user.model';
import { RecruiterProfileStore } from '@features/recruiter/pages/profile/data-access/state/recruiter-profile.store';
import { UserStore } from '@features/users/data-access/state/user.store';
import { ToastService } from '@core/services/toast.service';
import { ImageEditorService } from '@core/services/image-editor.service';
import { RecruiterProfileCard } from '@features/recruiter/pages/profile/ui/profile-card/recruiter-profile-card';
import { RecruiterContactInfo } from '@features/recruiter/pages/profile/ui/contact-info/recruiter-contact-info';
import { RecruiterCompaniesCard } from '@features/recruiter/pages/profile/ui/companies-card/recruiter-companies-card';
import { RecruiterExperienceTimeline } from '@features/recruiter/pages/profile/ui/experience-timeline/recruiter-experience-timeline';
import { SidebarCard } from '@features/recruiter/pages/profile/ui/sidebar-card/sidebar-card';
import { SocialListModal, SocialListType } from '@features/recruiter/pages/profile/ui/social-list-modal/social-list-modal';

@Component({
  selector: 'app-recruiter-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    RecruiterProfileCard,
    RecruiterContactInfo,
    RecruiterCompaniesCard,
    RecruiterExperienceTimeline,
    SidebarCard,
    SocialListModal,
  ],
  templateUrl: './recruiter-profile.html',
  styleUrl: './recruiter-profile.scss',
})
export class RecruiterProfilePage implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(RecruiterProfileStore);
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
      nombre: [''],
      nombreUsuario: [''],
      email: [''],
    });

    this.profileForm = this.fb.group({
      cargo: [''],
      ruc: [''],
      lema: [''],
      fechaCreacion: [''],
      modalidadTrabajo: [''],
      linkedin: [''],
      instagram: [''],
      tiktok: [''],
      facebook: [''],
    });

    effect(() => {
      const err = this.store.error();
      if (err) this.toast.error(err);
    });
  }

  get profile(): RecruiterProfile | null {
    return this.store.profile();
  }

  get loading(): boolean {
    return this.store.loading();
  }

  get hasProfile(): boolean {
    return this.store.hasProfile();
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
        if (user?.recruiterProfile) {
          this.store.profile.set(user.recruiterProfile);
          this.populateProfileForm(user.recruiterProfile);
        }
      },
    });
  }

  populateProfileForm(profile: RecruiterProfile): void {
    this.profileForm.patchValue({
      cargo: profile.cargo || '',
      ruc: profile.ruc || '',
      lema: profile.lema || '',
      empresasDescripcion: profile.empresasDescripcion || '',
      fechaCreacion: profile.fechaCreacion || '',
      modalidadTrabajo: profile.modalidadTrabajo || '',
      linkedin: profile.redesSociales?.linkedin || '',
      instagram: profile.redesSociales?.instagram || '',
      tiktok: profile.redesSociales?.tiktok || '',
      facebook: profile.redesSociales?.facebook || '',
    });
  }

  toggleEditBasic(): void {
    this.isEditingBasic.update(v => !v);
    if (this.isEditingBasic() && this.user()) {
      const u = this.user()!;
      this.basicForm.patchValue({
        nombre: u.nombre,
        nombreUsuario: u.nombreUsuario,
        email: u.email,
      });
    }
  }

  toggleEditProfile(): void {
    this.isEditingProfile.update(v => !v);
  }

  onSubmitBasic(): void {
    if (this.basicForm.valid && this.user()) {
      this.userStore.update(this.user()!.id, this.basicForm.value).subscribe({
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
      cargo: formValue.cargo,
      ruc: formValue.ruc,
      lema: formValue.lema,
      fechaCreacion: formValue.fechaCreacion || undefined,
      modalidadTrabajo: formValue.modalidadTrabajo,
      redesSociales: {
        linkedin: formValue.linkedin,
        instagram: formValue.instagram,
        tiktok: formValue.tiktok,
        facebook: formValue.facebook,
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
