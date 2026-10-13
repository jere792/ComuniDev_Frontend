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
