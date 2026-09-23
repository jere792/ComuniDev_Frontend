import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { CandidateStore } from '@features/recruiter/pages/candidates/data-access/state/candidate.store';
import { DeveloperProfile, TalentSearchFilters } from '@features/recruiter/pages/candidates/domain/models/developer-profile.model';
import { CandidateCard } from '@features/recruiter/ui/candidate-card/candidate-card';
import { ToastService } from '@core/services/toast.service';

const EXPERIENCE_LEVELS = ['JUNIOR', 'MID', 'SENIOR', 'LEAD'];
const AVAILABILITIES = ['DISPONIBLE', 'BUSCANDO_empleo', 'EMPLEADO'];

@Component({
  selector: 'app-recruiter-candidates',
  imports: [FormsModule, CandidateCard],
  templateUrl: './candidates.html',
  styleUrl: './candidates.scss',
})
export class RecruiterCandidates implements OnInit {
  private readonly candidateStore = inject(CandidateStore);
  private readonly toast = inject(ToastService);

  readonly store = this.candidateStore;
  readonly loading = this.candidateStore.loading;
  readonly error = this.candidateStore.error;
  readonly total = this.candidateStore.total;
  readonly experienceLevels = EXPERIENCE_LEVELS;
  readonly availabilities = AVAILABILITIES;
  readonly selectedTechnologies = new Set<string>();

  searchTerm = '';
  technologyInput = '';
  experienceLevel = '';
  locationCountry = '';
  locationCity = '';
  remoteAvailable = false;
  availability = '';

  ngOnInit(): void {
    this.search();
  }

  get candidates(): DeveloperProfile[] {
    return this.candidateStore.candidates();
  }

  get filteredCandidates(): DeveloperProfile[] {
    const term = this.searchTerm.trim().toLowerCase();
    const list = this.candidates;
    if (!term) return list;
    return list.filter(c =>
      (c.nombre ?? '').toLowerCase().includes(term) ||
      (c.tituloProfesional ?? '').toLowerCase().includes(term) ||
      (c.tecnologias ?? []).some(t => (t.nombre ?? '').toLowerCase().includes(term)),
    );
  }

  get techList(): string[] {
    return Array.from(this.selectedTechnologies);
  }

  addTechnology(): void {
    const value = this.technologyInput.trim();
    if (!value) return;
    this.technologyInput = '';
    this.selectedTechnologies.add(value);
    this.search();
  }

  removeTechnology(name: string): void {
    this.selectedTechnologies.delete(name);
    this.search();
  }

  search(overrides: Partial<TalentSearchFilters> = {}): void {
    const filters: TalentSearchFilters = {
      technologies: Array.from(this.selectedTechnologies),
      experienceLevel: this.experienceLevel || undefined,
      locationCountry: this.locationCountry.trim() || undefined,
      locationCity: this.locationCity.trim() || undefined,
      remoteAvailable: this.remoteAvailable || undefined,
      availability: this.availability || undefined,
      page: 0,
      size: 20,
      ...overrides,
    };

    this.candidateStore.loadCandidates(this.getRecruiterId(), filters);
  }

  toggleSave(candidate: DeveloperProfile): void {
    const recruiterId = this.getRecruiterId();
    if (!recruiterId) {
      this.toast.error('No se identificó al reclutador');
      return;
    }

    const action$: Observable<unknown> = this.candidateStore.isSaved(candidate.id)
      ? this.candidateStore.unsaveCandidate(recruiterId, candidate.id)
      : this.candidateStore.saveCandidate(recruiterId, candidate.id);

    action$.subscribe({
      next: () => {
        const saved = this.candidateStore.isSaved(candidate.id);
        this.toast.success(saved ? 'Perfil guardado' : 'Perfil quitado de guardados');
      },
      error: () => this.toast.error('No se pudo actualizar el guardado'),
    });
  }

  onMessage(candidate: DeveloperProfile): void {
    this.toast.info(`Mensaje a ${candidate.nombre} (próximamente)`);
  }

  private getRecruiterId(): string | null {
    return localStorage.getItem('userId');
  }

  trackById(_index: number, candidate: DeveloperProfile): string {
    return candidate.id;
  }

  skillsOf(candidate: DeveloperProfile): string[] {
    return (candidate.tecnologias ?? []).map(t => t.nombre).filter(Boolean);
  }

  experienceLabel(candidate: DeveloperProfile): string {
    const count = (candidate.experiencias ?? []).filter(e => e.empresa || e.cargo).length;
    if (count > 0) return `${count} experiencia${count === 1 ? '' : 's'}`;
    if (candidate.remoto) return 'Remoto';
    return candidate.ubicacionCiudad || candidate.ubicacionPais || '—';
  }

  availableOf(candidate: DeveloperProfile): boolean {
    return candidate.disponibilidadLaboral?.buscandoEmpleo ?? true;
  }

  avatarOf(candidate: DeveloperProfile): string {
    return candidate.fotoPerfilUrl || 'https://i.pravatar.cc/150?u=' + encodeURIComponent(candidate.id);
  }
}
