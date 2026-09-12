import { Injectable, signal, computed, inject } from '@angular/core';
import { DeveloperProfile } from '../../../../../core/domain/models/user.model';
import { DEVELOPER_PROFILE_REPOSITORY, DeveloperProfileRepository, CreateDeveloperProfileRequest, UpdateDeveloperProfileRequest } from '../../domain/ports/developer-profile.repository';

@Injectable({ providedIn: 'root' })
export class DeveloperProfileStore {
  private repository = inject<DeveloperProfileRepository>(DEVELOPER_PROFILE_REPOSITORY);

  readonly profile = signal<DeveloperProfile | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasProfile = computed(() => this.profile() !== null);

  loadByUserId(userId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.repository.getByUserId(userId).subscribe({
      next: (profile: DeveloperProfile | null) => {
        this.profile.set(profile);
        this.loading.set(false);
      },
      error: (_err: unknown) => {
        this.error.set('Error al cargar perfil de desarrollador');
        this.loading.set(false);
      },
    });
  }

  create(data: CreateDeveloperProfileRequest): void {
    this.loading.set(true);
    this.error.set(null);
    this.repository.create(data).subscribe({
      next: (profile: DeveloperProfile) => {
        this.profile.set(profile);
        this.loading.set(false);
      },
      error: (_err: unknown) => {
        this.error.set('Error al crear perfil');
        this.loading.set(false);
      },
    });
  }

  update(id: string, data: UpdateDeveloperProfileRequest): void {
    this.loading.set(true);
    this.error.set(null);
    this.repository.update(id, data).subscribe({
      next: (profile: DeveloperProfile) => {
        this.profile.set(profile);
        this.loading.set(false);
      },
      error: (_err: unknown) => {
        this.error.set('Error al actualizar perfil');
        this.loading.set(false);
      },
    });
  }

  clear(): void {
    this.profile.set(null);
    this.error.set(null);
  }
}
