import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { User, RecruiterProfile } from '../../../../core/domain/models/user.model';
import { RecruiterProfileStore } from '../data-access/state/recruiter-profile.store';
import { GraphQLService } from '../../../../core/services/graphql.service';
import { RecruiterProfileCard } from '../ui/profile-card/recruiter-profile-card';
import { RecruiterContactInfo } from '../ui/contact-info/recruiter-contact-info';
import { RecruiterCompaniesCard } from '../ui/companies-card/recruiter-companies-card';
import { RecruiterExperienceTimeline } from '../ui/experience-timeline/recruiter-experience-timeline';
import { SidebarCard } from '../ui/sidebar-card/sidebar-card';

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
  ],
  templateUrl: './recruiter-profile.html',
  styleUrl: './recruiter-profile.scss',
})
export class RecruiterProfilePage implements OnInit {
  user = signal<User | null>(null);
  isEditingBasic = signal(false);
  isEditingProfile = signal(false);
  updateMessage = signal('');
  uploadingImage = signal(false);
  basicForm: FormGroup;
  profileForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private store: RecruiterProfileStore,
    private graphql: GraphQLService,
  ) {
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
  }

  get profile(): RecruiterProfile | null {
    return this.store.profile();
  }

  get loading(): boolean {
    return this.store.loading();
  }

  get errorMessage(): string | null {
    return this.store.error();
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

    this.graphql.getUser(userId).subscribe({
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
      this.graphql.updateUser(this.user()!.id, this.basicForm.value).subscribe({
        next: (updatedUser: User) => {
          this.user.set(updatedUser);
          localStorage.setItem('userName', updatedUser.nombre);
          this.isEditingBasic.set(false);
          this.updateMessage.set('Datos básicos actualizados');
          setTimeout(() => this.updateMessage.set(''), 3000);
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
    this.updateMessage.set('Perfil profesional actualizado');
    setTimeout(() => this.updateMessage.set(''), 3000);
  }

  getInitials(): string {
    const name = this.user()?.nombre || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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

  private uploadImage(file: File, field: 'bannerUrl' | 'fotoPerfilUrl'): void {
    this.uploadingImage.set(true);
    this.graphql.uploadFile(file).subscribe({
      next: (res: { url: string }) => {
        const userId = this.user()?.id;
        if (!userId) return;
        this.graphql.updateUser(userId, { [field]: res.url }).subscribe({
          next: (updatedUser: User) => {
            this.user.set(updatedUser);
            this.uploadingImage.set(false);
            this.updateMessage.set(field === 'bannerUrl' ? 'Banner actualizado' : 'Foto de perfil actualizada');
            setTimeout(() => this.updateMessage.set(''), 3000);
          },
        });
      },
      error: () => {
        this.uploadingImage.set(false);
        this.updateMessage.set('Error al subir imagen');
        setTimeout(() => this.updateMessage.set(''), 3000);
      },
    });
  }
}
