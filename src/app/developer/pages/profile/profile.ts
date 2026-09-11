import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { GraphQLService, User, DeveloperProfileData } from '../../../core/services/graphql.service';

@Component({
  selector: 'app-developer-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class DeveloperProfile implements OnInit {
  user = signal<User | null>(null);
  profile = signal<DeveloperProfileData | null>(null);
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
      tituloProfesional: [''],
      bio: [''],
      ubicacionPais: [''],
      ubicacionCiudad: [''],
      ubicacionDistrito: [''],
      github: [''],
      linkedin: [''],
      portafolio: [''],
      buscandoEmpleo: [false],
      tecnologias: this.fb.array([]),
      habilidadesBlandas: [''],
    });
  }

  ngOnInit(): void {
    this.loadUser();
  }

  get tecnologias(): FormArray {
    return this.profileForm.get('tecnologias') as FormArray;
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
        this.profile.set(user?.developerProfile ?? null);
        this.loading.set(false);
        if (user?.developerProfile) {
          this.populateProfileForm(user.developerProfile);
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
        roles: [role || 'developer'],
        rolActivo: role || 'developer',
        estadoCuenta: 'ACTIVE',
        emailVerificado: true,
      });
    }
  }

  populateProfileForm(profile: DeveloperProfileData): void {
    this.profileForm.patchValue({
      tituloProfesional: profile.tituloProfesional || '',
      bio: profile.bio || '',
      ubicacionPais: profile.ubicacion?.pais || '',
      ubicacionCiudad: profile.ubicacion?.ciudad || '',
      ubicacionDistrito: profile.ubicacion?.distrito || '',
      github: profile.enlaces?.github || '',
      linkedin: profile.enlaces?.linkedin || '',
      portafolio: profile.enlaces?.portafolio || '',
      buscandoEmpleo: profile.disponibilidadLaboral?.buscandoEmpleo || false,
      habilidadesBlandas: profile.habilidadesBlandas?.join(', ') || '',
    });

    this.tecnologias.clear();
    profile.tecnologias?.forEach(tech => {
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
      });
    }
  }

  toggleEditProfile(): void {
    this.isEditingProfile.update(v => !v);
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

    const profileData = {
      tituloProfesional: formValue.tituloProfesional,
      bio: formValue.bio,
      ubicacion: {
        pais: formValue.ubicacionPais,
        ciudad: formValue.ubicacionCiudad,
        distrito: formValue.ubicacionDistrito,
      },
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

    const operation = this.profile()
      ? this.graphql.updateDeveloperProfile(this.profile()!.id, profileData)
      : this.graphql.createDeveloperProfile({ userId, ...profileData });

    operation.subscribe({
      next: (result: DeveloperProfileData) => {
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
