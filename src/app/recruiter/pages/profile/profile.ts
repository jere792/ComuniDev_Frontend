import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GraphQLService, User, RecruiterProfileData } from '../../../core/services/graphql.service';

@Component({
  selector: 'app-recruiter-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class RecruiterProfile implements OnInit {
  user = signal<User | null>(null);
  profile = signal<RecruiterProfileData | null>(null);
  isEditingBasic = signal(false);
  isEditingProfile = signal(false);
  profileForm: FormGroup;
  basicForm: FormGroup;
  updateMessage = signal('');
  errorMessage = signal('');
  loading = signal(false);

  constructor(
    private fb: FormBuilder,
    private graphql: GraphQLService
  ) {
    this.basicForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      nombreUsuario: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
    });

    this.profileForm = this.fb.group({
      bio: [''],
      nombres: [''],
      apellidos: [''],
      cargo: [''],
      telefono: [''],
      linkedinUrl: [''],
    });
  }

  ngOnInit(): void {
    this.loadUser();
  }

  loadUser(): void {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.errorMessage.set('No se encontró el ID de usuario');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.graphql.getUser(userId).subscribe({
      next: (user: User | null) => {
        this.user.set(user);
        this.profile.set(user?.recruiterProfile ?? null);
        this.loading.set(false);
        if (user?.recruiterProfile) {
          this.populateProfileForm(user.recruiterProfile);
        }
      },
      error: (err: any) => {
        console.error('Error loading user:', err);
        this.errorMessage.set('Error al cargar el perfil');
        this.loading.set(false);
        this.loadFromLocalStorage();
      },
    });
  }

  loadFromLocalStorage(): void {
    const userId = localStorage.getItem('userId');
    const nombre = localStorage.getItem('userName');
    const email = localStorage.getItem('userEmail');
    const role = localStorage.getItem('role');

    if (userId) {
      this.user.set({
        id: userId,
        nombre: nombre || 'Usuario',
        nombreUsuario: nombre ? nombre.toLowerCase().replace(/\s+/g, '') : 'usuario',
        email: email || '',
        fotoPerfilUrl: undefined,
        bannerUrl: undefined,
        roles: [role || 'recruiter'],
        rolActivo: role || 'recruiter',
        estadoCuenta: 'ACTIVE',
        emailVerificado: true,
      });
    }
  }

  populateProfileForm(profile: RecruiterProfileData): void {
    this.profileForm.patchValue({
      bio: profile.bio || '',
      nombres: profile.nombres || '',
      apellidos: profile.apellidos || '',
      cargo: profile.cargo || '',
      telefono: profile.telefono || '',
      linkedinUrl: profile.linkedinUrl || '',
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

  onBannerSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.loading.set(true);

    this.graphql.uploadFile(file).subscribe({
      next: (result: any) => {
        const bannerUrl = result.secure_url || result.url;

        if (this.profile()?.id) {
          this.graphql.updateRecruiterProfile(this.profile()!.id, { bannerUrl }).subscribe({
            next: (updated) => {
              this.profile.set(updated);
              this.loading.set(false);
              this.updateMessage.set('Banner actualizado');
              setTimeout(() => this.updateMessage.set(''), 3000);
            },
            error: () => {
              this.loading.set(false);
              this.errorMessage.set('Error al guardar banner');
            },
          });
        } else {
          this.graphql.updateUser(this.user()!.id, { bannerUrl }).subscribe({
            next: (updatedUser) => {
              this.user.set(updatedUser);
              this.loading.set(false);
              this.updateMessage.set('Banner actualizado');
              setTimeout(() => this.updateMessage.set(''), 3000);
            },
            error: () => {
              this.loading.set(false);
              this.errorMessage.set('Error al guardar banner');
            },
          });
        }
      },
      error: (err: any) => {
        console.error('Upload error:', err);
        this.loading.set(false);
        this.errorMessage.set('Error al subir imagen');
      },
    });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.loading.set(true);

    this.graphql.uploadFile(file).subscribe({
      next: (result: any) => {
        const fotoPerfilUrl = result.secure_url || result.url;
        this.graphql.updateUser(this.user()!.id, { fotoPerfilUrl }).subscribe({
          next: (updatedUser) => {
            this.user.set(updatedUser);
            localStorage.setItem('userPhoto', fotoPerfilUrl);
            this.loading.set(false);
            this.updateMessage.set('Foto de perfil actualizada');
            setTimeout(() => this.updateMessage.set(''), 3000);
          },
          error: () => {
            this.loading.set(false);
            this.errorMessage.set('Error al guardar foto');
          },
        });
      },
      error: (err: any) => {
        console.error('Upload error:', err);
        this.loading.set(false);
        this.errorMessage.set('Error al subir imagen');
      },
    });
  }

  onSubmitBasic(): void {
    if (this.basicForm.valid && this.user()) {
      this.loading.set(true);
      this.graphql.updateUser(this.user()!.id, this.basicForm.value).subscribe({
        next: (updatedUser: User) => {
          this.user.set(updatedUser);
          localStorage.setItem('userName', updatedUser.nombre);
          this.isEditingBasic.set(false);
          this.loading.set(false);
          this.updateMessage.set('Datos básicos actualizados');
          setTimeout(() => this.updateMessage.set(''), 3000);
        },
        error: (err: any) => {
          console.error('Error:', err);
          this.loading.set(false);
          this.errorMessage.set('Error al actualizar');
        },
      });
    }
  }

  onSubmitProfile(): void {
    const userId = this.user()?.id;
    if (!userId) return;

    this.loading.set(true);
    const formValue = this.profileForm.value;

    const operation = this.profile()
      ? this.graphql.updateRecruiterProfile(this.profile()!.id, formValue)
      : this.graphql.createRecruiterProfile({ userId, ...formValue });

    operation.subscribe({
      next: (result: RecruiterProfileData) => {
        this.profile.set(result);
        this.isEditingProfile.set(false);
        this.loading.set(false);
        this.updateMessage.set('Perfil profesional actualizado');
        setTimeout(() => this.updateMessage.set(''), 3000);
        this.loadUser();
      },
      error: (err: any) => {
        console.error('Error:', err);
        this.loading.set(false);
        this.errorMessage.set('Error al guardar perfil');
      },
    });
  }

  getInitials(): string {
    const name = this.user()?.nombre || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
