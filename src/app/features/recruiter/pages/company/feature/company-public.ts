import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import {
  COMPANY_REPOSITORY,
  Company,
  CompanyRepository,
} from '@features/recruiter/pages/company/domain/ports/company.repository';
import {
  OfferItem,
  VACANCY_REPOSITORY,
  VacancyRepository,
} from '@features/recruiter/pages/offers/domain/ports/vacancy.repository';
import { PostStore } from '@features/recruiter/pages/inicio/data-access/state/post.store';
import { ToastService } from '@core/services/toast.service';
import {
  CONTRATO_LABELS,
  MODALIDAD_LABELS,
  formatSalario,
  inicialesDe,
  relativeTime,
} from '@shared/utils/vacancy-format';

@Component({
  selector: 'app-company-public',
  imports: [RouterLink],
  templateUrl: './company-public.html',
  styleUrl: './company-public.scss',
})
export class CompanyPublic implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly companyRepository = inject<CompanyRepository>(COMPANY_REPOSITORY);
  private readonly vacancyRepository = inject<VacancyRepository>(VACANCY_REPOSITORY);
  private readonly postStore = inject(PostStore);
  private readonly toast = inject(ToastService);

  readonly company = signal<Company | null>(null);
  readonly vacancies = signal<OfferItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Empresa no encontrada');
      this.loading.set(false);
      return;
    }

    this.companyRepository.companyById(id).subscribe({
      next: company => {
        this.company.set(company);
        if (company) {
          this.loadVacancies(company.id);
        } else {
          this.error.set('Empresa no encontrada');
          this.loading.set(false);
        }
      },
      error: () => {
        this.error.set('No se pudo cargar la empresa');
        this.loading.set(false);
      },
    });
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }
    this.router.navigate(['/']);
  }

  iniciales(): string {
    return inicialesDe(this.company()?.nombre ?? '?');
  }

  ubicacionTexto(): string | null {
    const u = this.company()?.ubicacion;
    if (!u) return null;
    const partes = [u.ciudad, u.distrito, u.pais].filter(Boolean);
    return partes.length ? partes.join(', ') : null;
  }

  salario(offer: OfferItem): string | null {
    return formatSalario(offer.remuneracion);
  }

  publicado(offer: OfferItem): string | null {
    return relativeTime(offer.createdAt);
  }

  contratoLabel(offer: OfferItem): string {
    return CONTRATO_LABELS[offer.tipoContrato ?? ''] ?? offer.tipoContrato ?? '';
  }

  modalidadLabel(offer: OfferItem): string {
    return MODALIDAD_LABELS[offer.modalidad ?? ''] ?? offer.modalidad ?? '';
  }

  /** true si hay sesión iniciada: sin usuario no se puede publicar en el feed. */
  haySesion(): boolean {
    return !!localStorage.getItem('userId');
  }

  /** Solo el developer ve el acceso a postularse (HU-43). */
  esDeveloper(): boolean {
    const rol = (localStorage.getItem('role') || '').toLowerCase();
    return rol.includes('develop') || rol.includes('desarroll');
  }

  /** El developer abre el detalle de la vacante, donde está el botón "Postularme". */
  verOferta(offer: OfferItem): void {
    if (this.esDeveloper()) this.router.navigate(['/developer/vacantes', offer.id]);
  }

  /** Comparte la vacante en el feed como publicación con su tarjeta (tipo VACANTE). */
  compartirEnFeed(offer: OfferItem): void {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.toast.error('Inicia sesión para compartir en el feed');
      return;
    }

    this.postStore
      .createPost(
        userId,
        { texto: `Les comparto esta oferta: ${offer.titulo}` },
        undefined,
        undefined,
        undefined,
        'VACANTE',
        offer.id
      )
      .subscribe({
        next: () => {
          this.toast.success('Oferta publicada en el feed');
          // cada rol tiene su propio feed: se abre el del usuario para que vea la publicación
          const rol = (localStorage.getItem('role') || 'developer').toLowerCase();
          const esReclutador = rol.includes('reclut') || rol.includes('recruit');
          this.router.navigate([esReclutador ? '/recruiter/inicio' : '/developer/inicio']);
        },
        error: () => this.toast.error('No se pudo publicar en el feed'),
      });
  }

  private loadVacancies(companyId: string): void {
    this.vacancyRepository.vacanciesByCompany(companyId).subscribe({
      next: list => {
        // CA-HU-42: el listado público no incluye vacantes cerradas ni vencidas.
        this.vacancies.set(list.filter(v => v.estado === 'ACTIVA'));
        this.loading.set(false);
      },
      error: () => {
        this.vacancies.set([]);
        this.loading.set(false);
      },
    });
  }

  trackById(_index: number, offer: OfferItem): string {
    return offer.id;
  }
}
