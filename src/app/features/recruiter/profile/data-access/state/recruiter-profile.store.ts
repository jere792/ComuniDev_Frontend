import { Injectable, signal, computed, inject } from '@angular/core';
import { RecruiterProfile } from '../../../../../core/domain/models/user.model';
import { RECRUITER_PROFILE_REPOSITORY, RecruiterProfileRepository, CreateRecruiterProfileRequest, UpdateRecruiterProfileRequest } from '../../domain/ports/recruiter-profile.repository';

@Injectable({ providedIn: 'root' })
export class RecruiterProfileStore {
  private repository = inject<RecruiterProfileRepository>(RECRUITER_PROFILE_REPOSITORY);

  readonly profile = signal<RecruiterProfile | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasProfile = computed(() => this.profile() !== null);

  loadByUserId(userId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.repository.getByUserId(userId).subscribe({
      next: (profile: RecruiterProfile | null) => {
        this.profile.set(profile);
        this.loading.set(false);
      },
      error: (_err: unknown) => {
        this.error.set('Error al cargar perfil de reclutador');
        this.loading.set(false);
      },
    });
  }

  create(data: CreateRecruiterProfileRequest): void {
    this.loading.set(true);
    this.error.set(null);
    this.repository.create(data).subscribe({
      next: (profile: RecruiterProfile) => {
        this.profile.set(profile);
        this.loading.set(false);
      },
      error: (_err: unknown) => {
        this.error.set('Error al crear perfil');
        this.loading.set(false);
      },
    });
  }

  update(id: string, data: UpdateRecruiterProfileRequest): void {
    this.loading.set(true);
    this.error.set(null);
    this.repository.update(id, data).subscribe({
      next: (profile: RecruiterProfile) => {
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
