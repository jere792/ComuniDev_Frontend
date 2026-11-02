import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '@core/services/toast.service';
import { ConfirmModal } from '@shared/ui/confirm-modal/confirm-modal';
import { ApplyModal } from '@features/developer/postulaciones/ui/apply-modal/apply-modal';
import { ApplicationStore } from '@features/developer/postulaciones/data-access/state/application.store';
import {
  VACANCY_DETAIL_REPOSITORY,
  VacancyDetailRepository,
} from '@features/developer/postulaciones/domain/ports/vacancy-detail.repository';
import { VacancyDetail } from '@features/developer/postulaciones/domain/models/vacancy-detail.model';
import {
  ESTADO_LABELS as APLICACION_ESTADO_LABELS,
  ESTADO_CLASES as APLICACION_ESTADO_CLASES,
  esActiva,
} from '@features/developer/postulaciones/domain/models/application.model';
import {
  CONTRATO_LABELS,
  MODALIDAD_LABELS,
  ESTADO_LABELS as VACANCY_ESTADO_LABELS,
  ESTADO_CLASES as VACANCY_ESTADO_CLASES,
  formatSalario,
  inicialesDe,
  relativeTime,
} from '@shared/utils/vacancy-format';

/** Detalle de una vacante vista desde la web; aquí vive el botón "Postularme". */
@Component({
  selector: 'app-vacancy-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmModal, ApplyModal],
  templateUrl: './vacancy-detail.html',
  styleUrl: './vacancy-detail.scss',
})
export class VacancyDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toast = inject(ToastService);
  private readonly vacancyRepository = inject<VacancyDetailRepository>(VACANCY_DETAIL_REPOSITORY);
  private readonly applicationStore = inject(ApplicationStore);

  readonly vacancy = signal<VacancyDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly applyOpen = signal(false);
  readonly sending = signal(false);
  readonly withdrawOpen = signal(false);

  /** Solo el rol developer ve el bloque de postulación. */
  readonly esDeveloper = this.detectarDeveloper();

  private readonly vacancyId = signal('');

  /** Postulación del developer a esta vacante (incluida la retirada). */
  readonly miPostulacion = computed(() => this.applicationStore.findByVacancy(this.vacancyId()));

  /** true cuando la postulación sigue viva (ENVIADA, EN_REVISION, ACEPTADA…). */
  readonly postulado = computed(() => {
    const app = this.miPostulacion();
    return !!app && esActiva(app.estado);
  });

  readonly retirada = computed(() => this.miPostulacion()?.estado === 'RETIRADA');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.vacancyId.set(id);
    if (!id) {
      this.error.set('No se encontró la vacante');
      this.loading.set(false);
      return;
    }

    this.vacancyRepository.vacancyById(id).subscribe({
      next: (vacancy) => {
        this.vacancy.set(vacancy);
        this.loading.set(false);
        if (!vacancy) this.error.set('No se encontró la vacante');
      },
      error: () => {
        this.error.set('No se pudo cargar la vacante');
        this.loading.set(false);
      },
    });

    if (this.esDeveloper) {
      const userId = localStorage.getItem('userId');
      if (userId) this.applicationStore.load(userId);
    }
  }

  // ------------------------------------------------------------ postulación

  abrirModal(): void {
    this.applyOpen.set(true);
  }

  cerrarModal(): void {
    this.applyOpen.set(false);
  }

  postularme(carta: string): void {
    const developerId = localStorage.getItem('userId');
    if (!developerId) {
      this.cerrarModal();
      this.toast.error('Inicia sesión para postular');
      return;
    }

    this.sending.set(true);
    this.applicationStore.applyToVacancy(this.vacancyId(), developerId, carta).subscribe({
      next: (application) => {
        this.sending.set(false);
        this.cerrarModal();
        if (application) {
          this.toast.success('Postulación enviada');
          this.vacancy.update((v) =>
            v ? { ...v, postulacionesCount: (v.postulacionesCount ?? 0) + 1 } : v,
          );
        }
      },
      error: (err) => {
        this.sending.set(false);
        this.cerrarModal();
        this.toast.error(err?.error?.message ?? 'No se pudo enviar la postulación');
      },
    });
  }

  pedirRetiro(): void {
    this.withdrawOpen.set(true);
  }

  retirarPostulacion(): void {
    const app = this.miPostulacion();
    this.withdrawOpen.set(false);
    if (!app) return;

    this.applicationStore.withdrawApplication(app.id).subscribe({
      next: (ok) => {
        if (ok) {
          this.toast.success('Postulación retirada');
          this.vacancy.update((v) =>
            v
              ? { ...v, postulacionesCount: Math.max((v.postulacionesCount ?? 1) - 1, 0) }
              : v,
          );
        } else {
          this.toast.error('No se pudo retirar la postulación');
        }
      },
      error: () => this.toast.error('No se pudo retirar la postulación'),
    });
  }

  /** RN-21: una vacante cerrada o vencida deja de recibir postulaciones. */
  puedePostular(): boolean {
    const v = this.vacancy();
    if (!v || v.estado !== 'ACTIVA') return false;
    if (v.fechaLimite && Date.parse(v.fechaLimite) < Date.now()) return false;
    return !this.miPostulacion();
  }

  // --------------------------------------------------------------- formato

  estadoAplicacionLabel(estado: string): string {
    return APLICACION_ESTADO_LABELS[estado] ?? estado;
  }

  estadoAplicacionClase(estado: string): string {
    return APLICACION_ESTADO_CLASES[estado] ?? '';
  }

  estadoVacancyLabel(): string {
    const estado = this.vacancy()?.estado ?? '';
    return VACANCY_ESTADO_LABELS[estado] ?? estado;
  }

  estadoVacancyClase(): string {
    return VACANCY_ESTADO_CLASES[this.vacancy()?.estado ?? ''] ?? '';
  }

  modalidadLabel(): string | null {
    const value = this.vacancy()?.modalidad;
    return value ? MODALIDAD_LABELS[value] ?? value : null;
  }

  contratoLabel(): string | null {
    const value = this.vacancy()?.tipoContrato;
    return value ? CONTRATO_LABELS[value] ?? value : null;
  }

  salario(): string | null {
    return formatSalario(this.vacancy()?.remuneracion ?? null);
  }

  empresaNombre(): string {
    return this.vacancy()?.company?.nombre?.trim() || 'Sin empresa';
  }

  empresaIniciales(): string {
    return inicialesDe(this.empresaNombre());
  }

  publicada(): string | null {
    return relativeTime(this.vacancy()?.createdAt ?? null);
  }

  vence(): string | null {
    return relativeTime(this.vacancy()?.fechaLimite ?? null);
  }

  vencida(): boolean {
    const fecha = this.vacancy()?.fechaLimite;
    return !!fecha && Date.parse(fecha) < Date.now();
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/developer/inicio']);
    }
  }

  private detectarDeveloper(): boolean {
    const rol = (localStorage.getItem('role') || '').toLowerCase();
    return rol.includes('develop') || rol.includes('desarroll');
  }
}
