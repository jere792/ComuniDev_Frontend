import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CandidateStore } from '@features/recruiter/pages/candidates/data-access/state/candidate.store';
import { DeveloperProfile } from '@features/recruiter/pages/candidates/domain/models/developer-profile.model';
import { FollowStore } from '@features/shared/data-access/state/follow.store';
import { ConnectionStore } from '@features/shared/data-access/state/connection.store';
import { ToastService } from '@core/services/toast.service';

type ComposerMode = 'message' | 'proposal';

@Component({
  selector: 'app-recruiter-candidates',
  imports: [FormsModule],
  templateUrl: './candidates.html',
  styleUrl: './candidates.scss',
})
export class RecruiterCandidates implements OnInit {
  private readonly candidateStore = inject(CandidateStore);
  private readonly followStore = inject(FollowStore);
  private readonly connectionStore = inject(ConnectionStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly store = this.candidateStore;
  readonly loading = this.candidateStore.loading;
  readonly error = this.candidateStore.error;
  readonly total = this.candidateStore.total;

  currentIndex = signal(0);
  sectionIndex = signal(0);
  composerMode = signal<ComposerMode | null>(null);
  composerText = '';

  private static readonly SECTION_META: Record<string, { label: string; icon: string }> = {
    about: { label: 'Sobre', icon: 'person' },
    experience: { label: 'Experiencia', icon: 'work_history' },
    tech: { label: 'Tecnologías', icon: 'code' },
    soft: { label: 'Habilidades blandas', icon: 'psychology' },
    social: { label: 'Redes sociales', icon: 'share' },
    contact: { label: 'Contacto', icon: 'contact_mail' },
    availability: { label: 'Disponibilidad', icon: 'event_available' },
    education: { label: 'Educación', icon: 'school' },
    certs: { label: 'Certificados', icon: 'workspace_premium' },
    projects: { label: 'Proyectos', icon: 'folder' },
    cv: { label: 'CV', icon: 'description' },
  };

  readonly deck = computed<DeveloperProfile[]>(() => this.candidateStore.candidates());

  readonly currentCandidate = computed<DeveloperProfile | null>(
    () => this.deck()[this.currentIndex()] ?? null,
  );

  readonly deckPosition = computed(() => {
    const list = this.deck();
    if (list.length === 0) return 0;
    return Math.min(this.currentIndex() + 1, list.length);
  });

  readonly sections = computed<string[]>(() => {
    const dev = this.currentCandidate();
    if (!dev) return [];
    const keys: string[] = [];
    if (dev.bio) keys.push('about');
    if (dev.experiencias?.length) keys.push('experience');
    if (dev.tecnologias?.length) keys.push('tech');
    if (dev.habilidadesBlandas?.length) keys.push('soft');
    if (dev.enlaces?.github || dev.enlaces?.linkedin || dev.enlaces?.portafolio) keys.push('social');
    if (dev.email || dev.telefono || dev.sitioWeb) keys.push('contact');
    if (dev.disponibilidadLaboral) keys.push('availability');
    if (dev.educacion?.length) keys.push('education');
    if (dev.certificados?.length) keys.push('certs');
    if (dev.proyectos?.length) keys.push('projects');
    if (dev.cv?.archivoUrl) keys.push('cv');
    return keys;
  });

  readonly currentSection = computed<string | null>(
    () => this.sections()[this.sectionIndex()] ?? null,
  );

  readonly sectionPosition = computed(() => {
    const total = this.sections().length;
    if (total === 0) return 0;
    return Math.min(this.sectionIndex() + 1, total);
  });

  ngOnInit(): void {
    this.loadCandidates();
  }

  private loadCandidates(): void {
    this.currentIndex.set(0);
    this.sectionIndex.set(0);
    this.composerMode.set(null);
    this.composerText = '';
    this.candidateStore.loadCandidates(this.getRecruiterId(), { page: 0, size: 20 });
  }

  skip(): void {
    this.composerMode.set(null);
    this.composerText = '';
    const length = this.deck().length;
    this.sectionIndex.set(0);
    this.currentIndex.update(i => Math.min(i + 1, length));
  }

  nextSection(): void {
    const total = this.sections().length;
    if (this.sectionIndex() < total - 1) {
      this.sectionIndex.update(i => i + 1);
    } else {
      this.skip();
    }
  }

  sectionLabel(key: string): string {
    return RecruiterCandidates.SECTION_META[key]?.label ?? '';
  }

  sectionIcon(key: string): string {
    return RecruiterCandidates.SECTION_META[key]?.icon ?? 'chevron_right';
  }

  save(): void {
    const dev = this.currentCandidate();
    const recruiterId = this.getRecruiterId();
    if (!dev || !recruiterId) return;

    if (this.candidateStore.isSaved(dev.id)) {
      this.skip();
      return;
    }

    this.candidateStore.saveCandidate(recruiterId, dev.id).subscribe({
      next: () => {
        this.toast.success(`${dev.nombre} guardado`);
        this.skip();
      },
      error: () => this.toast.error('No se pudo guardar el candidato'),
    });
  }

  follow(): void {
    const dev = this.currentCandidate();
    const recruiterId = this.getRecruiterId();
    if (!dev || !recruiterId) return;

    this.followStore.follow(recruiterId, dev.id).subscribe({
      next: () => this.toast.success(`Ahora sigues a ${dev.nombre}`),
      error: () => this.toast.error('No se pudo seguir al candidato'),
    });
  }

  openComposer(mode: ComposerMode): void {
    this.composerMode.set(this.composerMode() === mode ? null : mode);
    this.composerText = '';
  }

  closeComposer(): void {
    this.composerMode.set(null);
    this.composerText = '';
  }

  sendComposer(): void {
    const dev = this.currentCandidate();
    const recruiterId = this.getRecruiterId();
    const mode = this.composerMode();
    const text = this.composerText.trim();
    if (!dev || !recruiterId || !mode || !text) return;

    this.connectionStore.sendRequest(recruiterId, dev.id, text).subscribe({
      next: () => {
        this.toast.success(
          mode === 'proposal' ? `Propuesta enviada a ${dev.nombre}` : `Mensaje enviado a ${dev.nombre}`,
        );
        this.composerMode.set(null);
        this.composerText = '';
      },
      error: () => this.toast.error('No se pudo enviar'),
    });
  }

  onViewProfile(dev: DeveloperProfile): void {
    this.router.navigate(['/profile', dev.id]);
  }

  isSaved(dev: DeveloperProfile): boolean {
    return this.candidateStore.isSaved(dev.id);
  }

  initials(dev: DeveloperProfile): string {
    return (dev.nombre || '?')
      .split(' ')
      .filter(Boolean)
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  location(dev: DeveloperProfile): string {
    return [dev.ubicacionCiudad, dev.ubicacionDepartamento, dev.ubicacionPais].filter(Boolean).join(', ');
  }

  salary(dev: DeveloperProfile): string | null {
    const pretension = dev.disponibilidadLaboral?.pretensionSalarial;
    if (!pretension || (pretension.minimo == null && pretension.maximo == null)) return null;
    const moneda = pretension.moneda ?? '';
    if (pretension.minimo != null && pretension.maximo != null) {
      return `${moneda} ${pretension.minimo} - ${pretension.maximo}`;
    }
    return `${moneda} ${pretension.minimo ?? pretension.maximo}`;
  }

  private getRecruiterId(): string | null {
    return localStorage.getItem('userId');
  }
}
