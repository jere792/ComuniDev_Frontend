import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

interface UserProfile {
  id: string;
  nombre: string;
  nombreUsuario: string;
  email: string;
  fotoPerfilUrl?: string;
  bannerUrl?: string;
  bio?: string;
  rolActivo: string;
}

@Component({
  selector: 'app-developer-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class DeveloperProfile {
  user = signal<UserProfile | null>(null);
  isEditing = signal(false);
  profileForm: FormGroup;
  updateMessage = signal('');

  constructor(private fb: FormBuilder) {
    this.loadUser();
    this.profileForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      nombreUsuario: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      bio: ['', [Validators.maxLength(500)]],
    });
  }

  loadUser(): void {
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
        bio: '',
        rolActivo: role || 'developer',
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
        bio: u.bio || '',
      });
    }
    this.updateMessage.set('');
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      const values = this.profileForm.value;
      this.user.update(u => u ? { ...u, ...values } : null);
      localStorage.setItem('userName', values.nombre);
      this.isEditing.set(false);
      this.updateMessage.set('Perfil actualizado correctamente');
      setTimeout(() => this.updateMessage.set(''), 3000);
    }
  }

  getInitials(): string {
    const name = this.user()?.nombre || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
