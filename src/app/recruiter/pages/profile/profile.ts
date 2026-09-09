import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GraphQLService, User } from '../../../core/services/graphql.service';

@Component({
  selector: 'app-recruiter-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class RecruiterProfile implements OnInit {
  user = signal<User | null>(null);
  isEditing = signal(false);
  profileForm: FormGroup;
  updateMessage = signal('');
  errorMessage = signal('');
  loading = signal(false);

  constructor(
    private fb: FormBuilder,
    private graphql: GraphQLService
  ) {
    this.profileForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      nombreUsuario: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
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
      next: (user: any) => {
        this.user.set(user);
        this.loading.set(false);
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

  toggleEdit(): void {
    this.isEditing.update(v => !v);
    if (this.isEditing() && this.user()) {
      const u = this.user()!;
      this.profileForm.patchValue({
        nombre: u.nombre,
        nombreUsuario: u.nombreUsuario,
        email: u.email,
      });
    }
    this.updateMessage.set('');
    this.errorMessage.set('');
  }

  onSubmit(): void {
    if (this.profileForm.valid && this.user()) {
      this.loading.set(true);
      const values = this.profileForm.value;
      const userId = this.user()!.id;

      this.graphql.updateUser(userId, values).subscribe({
        next: (updatedUser: any) => {
          this.user.set(updatedUser);
          localStorage.setItem('userName', updatedUser.nombre);
          this.isEditing.set(false);
          this.loading.set(false);
          this.updateMessage.set('Perfil actualizado correctamente');
          setTimeout(() => this.updateMessage.set(''), 3000);
        },
        error: (err: any) => {
          console.error('Error updating user:', err);
          this.loading.set(false);
          this.errorMessage.set('Error al actualizar el perfil');
        },
      });
    }
  }

  getInitials(): string {
    const name = this.user()?.nombre || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
