import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { OfferStore } from '@features/recruiter/pages/offers/data-access/state/offer.store';
import { OfferItem } from '@features/recruiter/pages/offers/domain/models/vacancy.model';
import { ToastService } from '@core/services/toast.service';
import {
  CONTRATO_LABELS,
  ESTADO_CLASES,
  ESTADO_LABELS,
  MODALIDAD_LABELS,
  formatSalario,
  inicialesDe,
  relativeTime,
} from '@shared/utils/vacancy-format';

@Component({
  selector: 'app-recruiter-offers',
  templateUrl: './offers.html',
  styleUrl: './offers.scss',
})
export class RecruiterOffers implements OnInit {
  private readonly store = inject(OfferStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly offers = this.store.offers;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  /** En móvil se llega a Candidatos desde aquí (el footer no incluye esa ruta). */
  irACandidatos(): void {
    this.router.navigate(['/recruiter/candidates']);
  }

  ngOnInit(): void {
    const recruiterId = this.getRecruiterId();
    if (!recruiterId) {
      this.store.error.set('No se identificó al reclutador');
      return;
    }
    this.store.load(recruiterId);
  }

  createOffer(): void {
    this.router.navigate(['/recruiter/offers/new']);
  }

  /** Abre la página pública de la empresa desde la tarjeta. */
  verEmpresa(offer: OfferItem): void {
    if (offer.companyId) this.router.navigate(['/company', offer.companyId]);
  }

  /** HU-41: el reclutador cierra y reabre manualmente. */
  toggleEstado(offer: OfferItem): void {
    const recruiterId = this.getRecruiterId();
    if (!recruiterId) return;

    const next = offer.estado === 'ACTIVA' ? 'CERRADA' : 'ACTIVA';
    this.store.setEstado(offer.id, next).subscribe({
      next: () => this.toast.success(next === 'CERRADA' ? 'Oferta cerrada' : 'Oferta reactivada'),
      error: () => this.toast.error('No se pudo cambiar el estado'),
    });
  }

  // -------------------------------------------------------------- formato

  /** Sin empresa, la oferta se publica a nombre del reclutador independiente. */
  empresa(offer: OfferItem): string {
    return offer.company?.nombre ?? this.userName();
  }

  empresaLogo(offer: OfferItem): string | null {
    return offer.company?.logoUrl ?? null;
  }

  empresaSector(offer: OfferItem): string | null {
    return offer.company?.sector ?? null;
  }

  inicialesEmpresa(offer: OfferItem): string {
    return inicialesDe(this.empresa(offer));
  }

  estadoLabel(offer: OfferItem): string {
    return ESTADO_LABELS[offer.estado ?? ''] ?? offer.estado ?? '';
  }

  estadoClass(offer: OfferItem): string {
    return ESTADO_CLASES[offer.estado ?? ''] ?? '';
  }

  contratoLabel(offer: OfferItem): string {
    return CONTRATO_LABELS[offer.tipoContrato ?? ''] ?? offer.tipoContrato ?? '';
  }

  modalidadLabel(offer: OfferItem): string {
    return MODALIDAD_LABELS[offer.modalidad ?? ''] ?? offer.modalidad ?? '';
  }

  salario(offer: OfferItem): string | null {
    return formatSalario(offer.remuneracion);
  }

  publicado(offer: OfferItem): string | null {
    return relativeTime(offer.createdAt);
  }

  vence(offer: OfferItem): string | null {
    return relativeTime(offer.fechaLimite);
  }

  trackById(_index: number, offer: OfferItem): string {
    return offer.id;
  }

  private getRecruiterId(): string | null {
    return localStorage.getItem('userId');
  }

  private userName(): string {
    return localStorage.getItem('userName') ?? 'Independiente';
  }
}
