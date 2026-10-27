import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CandidateStore } from '@features/recruiter/pages/candidates/data-access/state/candidate.store';
import { DeveloperProfile } from '@features/recruiter/pages/candidates/domain/models/developer-profile.model';
import {
  CandidateBlock,
  CandidateBlockCard,
} from '@features/recruiter/pages/candidates/ui/candidate-block/candidate-block';
import { FollowStore } from '@features/shared/data-access/state/follow.store';
import { ConnectionStore } from '@features/shared/data-access/state/connection.store';
import { ToastService } from '@core/services/toast.service';

type ComposerMode = 'message' | 'proposal';

@Component({
  selector: 'app-recruiter-candidates',
  imports: [FormsModule, CandidateBlockCard],
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
  blockPage = signal(0);
  composerMode = signal<ComposerMode | null>(null);
  composerText = '';
  expandedBlock = signal<CandidateBlock | null>(null);
  saving = false;

  private static readonly BLOCKS_PER_PAGE = 4;

  private static readonly BLOCK_META: CandidateBlock[] = [
    { key: 'experience', label: 'Experiencia', icon: 'work_history' },
    { key: 'tech', label: 'Tecnologías', icon: 'code' },
    { key: 'soft', label: 'Habilidades blandas', icon: 'psychology' },
    { key: 'education', label: 'Educación', icon: 'school' },
    { key: 'certs', label: 'Certificados', icon: 'workspace_premium' },
    { key: 'projects', label: 'Proyectos', icon: 'folder' },
    { key: 'availability', label: 'Disponibilidad', icon: 'event_available' },
    { key: 'social', label: 'Redes sociales', icon: 'share' },
    { key: 'contact', label: 'Contacto', icon: 'contact_mail' },
    { key: 'cv', label: 'CV', icon: 'description' },
  ];

  readonly deck = computed<DeveloperProfile[]>(() => this.candidateStore.candidates());

  readonly currentCandidate = computed<DeveloperProfile | null>(
    () => this.deck()[this.currentIndex()] ?? null,
  );

  readonly deckPosition = computed(() => {
    const list = this.deck();
    if (list.length === 0) return 0;
    return Math.min(this.currentIndex() + 1, list.length);
  });

  readonly visibleBlocks = computed<CandidateBlock[]>(() => {
    const dev = this.currentCandidate();
    if (!dev) return [];
    return RecruiterCandidates.BLOCK_META.filter(block =>
      RecruiterCandidates.hasBlockData(block.key, dev),
    );
  });

  readonly blockPages = computed<CandidateBlock[][]>(() => {
    const blocks = this.visibleBlocks();
    const pages: CandidateBlock[][] = [];
    for (let i = 0; i < blocks.length; i += RecruiterCandidates.BLOCKS_PER_PAGE) {
      pages.push(blocks.slice(i, i + RecruiterCandidates.BLOCKS_PER_PAGE));
    }
    return pages;
  });

  readonly currentBlocks = computed<CandidateBlock[]>(
    () => this.blockPages()[this.blockPage()] ?? [],
  );

  readonly leftBlocks = computed<CandidateBlock[]>(() => this.currentBlocks().slice(0, 2));
  readonly rightBlocks = computed<CandidateBlock[]>(() => this.currentBlocks().slice(2, 4));

  readonly blocksNavVisible = computed(() => this.blockPages().length > 1);

  readonly salaryText = computed<string | null>(() => {
    const dev = this.currentCandidate();
    return dev ? this.salary(dev) : null;
  });

  private static hasBlockData(key: string, dev: DeveloperProfile): boolean {
    switch (key) {
      case 'experience':
        return !!dev.experiencias?.length;
      case 'tech':
        return !!dev.tecnologias?.length;
      case 'soft':
        return !!dev.habilidadesBlandas?.length;
      case 'education':
        return !!dev.educacion?.length;
      case 'certs':
        return !!dev.certificados?.length;
      case 'projects':
        return !!dev.proyectos?.length;
      case 'availability':
        return !!dev.disponibilidadLaboral;
      case 'social':
        return !!(dev.enlaces?.github || dev.enlaces?.linkedin || dev.enlaces?.portafolio);
      case 'contact':
        return !!(dev.email || dev.telefono || dev.sitioWeb);
      case 'cv':
        return !!dev.cv?.archivoUrl;
      default:
        return false;
    }
  }

  ngOnInit(): void {
    this.loadCandidates();
  }

  private loadCandidates(): void {
    this.currentIndex.set(0);
    this.blockPage.set(0);
    this.composerMode.set(null);
    this.composerText = '';
    this.candidateStore.loadCandidates(this.getRecruiterId(), { page: 0, size: 20 });
  }

  skip(): void {
    this.composerMode.set(null);
    this.composerText = '';
    const length = this.deck().length;
    this.blockPage.set(0);
    this.currentIndex.update(i => Math.min(i + 1, length));
  }

  prevBlocks(): void {
    this.blockPage.update(page => Math.max(0, page - 1));
  }

  nextBlocks(): void {
    this.blockPage.update(page => Math.min(this.blockPages().length - 1, page + 1));
  }

  goToBlockPage(page: number): void {
    this.blockPage.set(Math.max(0, Math.min(page, this.blockPages().length - 1)));
  }

  openBlockModal(block: CandidateBlock): void {
    this.expandedBlock.set(block);
  }

  closeBlockModal(): void {
    this.expandedBlock.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeBlockModal();
  }

  save(): void {
    const dev = this.currentCandidate();
    const recruiterId = this.getRecruiterId();
    if (!dev || !recruiterId || this.saving) return;

    if (this.candidateStore.isSaved(dev.id)) {
      this.skip();
      return;
    }

    this.saving = true;
    this.candidateStore.saveCandidate(recruiterId, dev.id).subscribe({
      next: () => {
        this.saving = false;
        this.toast.success(`${dev.nombre} guardado`);
        this.skip();
      },
      error: () => {
        this.candidateStore.syncSavedState(recruiterId, dev.id).subscribe(saved => {
          this.saving = false;
          if (saved) {
            this.toast.info('El candidato ya estaba guardado');
            this.skip();
          } else {
            this.toast.error('No se pudo guardar el candidato');
          }
        });
      },
    });
  }

  follow(): void {
    const dev = this.currentCandidate();
    const recruiterId = this.getRecruiterId();
    if (!dev || !recruiterId) return;

    this.followStore.follow(recruiterId, dev.id).subscribe({
      next: (resultado) => {
        if (!resultado) {
          // perfil privado: queda solicitud enviada
          this.toast.success('Solicitud de seguimiento enviada');
          return;
        }
        this.toast.success(`Ahora sigues a ${dev.nombre}`);
      },
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
