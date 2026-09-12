import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { User, DeveloperProfile } from '../../../../core/domain/models/user.model';
import { DeveloperProfileStore } from '../data-access/state/developer-profile.store';
import { GraphQLService } from '../../../../core/services/graphql.service';

@Component({
  selector: 'app-developer-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './developer-profile.html',
  styleUrl: './developer-profile.scss',
})
export class DeveloperProfilePage implements OnInit {
  user = signal<User | null>(null);
  isEditingBasic = signal(false);
  isEditingProfile = signal(false);
  updateMessage = signal('');
  uploadingImage = signal(false);
  basicForm: FormGroup;
  profileForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private store: DeveloperProfileStore,
    private graphql: GraphQLService,
  ) {
    this.basicForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      nombreUsuario: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      bio: [''],
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
  }

  get profile(): DeveloperProfile | null {
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

  get tecnologias(): FormArray {
    return this.profileForm.get('tecnologias') as FormArray;
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
    this.isEditingBasic.update(v => !v);
    if (this.isEditingBasic() && this.user()) {
      const u = this.user()!;
      this.basicForm.patchValue({
        nombre: u.nombre,
        nombreUsuario: u.nombreUsuario,
        email: u.email,
        bio: u.bio || '',
        ubicacionPais: u.ubicacion?.pais || '',
        ubicacionCiudad: u.ubicacion?.ciudad || '',
        ubicacionDistrito: u.ubicacion?.distrito || '',
      });
    }
  }

  toggleEditProfile(): void {
    this.isEditingProfile.update(v => !v);
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
        ubicacion: {
          pais: formValue.ubicacionPais,
          ciudad: formValue.ubicacionCiudad,
          distrito: formValue.ubicacionDistrito,
        },
      };
      this.graphql.updateUser(this.user()!.id, payload).subscribe({
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
