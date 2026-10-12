import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { OfferStore } from '@features/recruiter/pages/offers/data-access/state/offer.store';
import { OfferItem } from '@features/recruiter/pages/offers/domain/models/vacancy.model';
import { ToastService } from '@core/services/toast.service';

const ESTADO_LABELS: Record<string, string> = {
  ACTIVA: 'Activa',
  PAUSADA: 'Pausada',
  CERRADA: 'Cerrada',
  VENCIDA: 'Vencida',
};

const ESTADO_CLASES: Record<string, string> = {
  ACTIVA: 'active',
  PAUSADA: 'paused',
  CERRADA: 'closed',
  VENCIDA: 'expired',
};

const CONTRATO_LABELS: Record<string, string> = {
  TIEMPO_COMPLETO: 'Tiempo completo',
  MEDIO_TIEMPO: 'Medio tiempo',
  POR_PROYECTO: 'Por proyecto',
  FREELANCE: 'Freelance',
  PRACTICAS: 'Prácticas',
};

const MODALIDAD_LABELS: Record<string, string> = {
  REMOTO: 'Remoto',
  PRESENCIAL: 'Presencial',
  HIBRIDO: 'Híbrido',
};

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
    const r = offer.remuneracion;
    if (!r || r.visible === false) return null;

    const moneda = r.moneda ?? '';
    if (r.minimo != null && r.maximo != null) {
      return `${moneda} ${this.formatNumber(r.minimo)} - ${this.formatNumber(r.maximo)}`;
    }
    const single = r.minimo ?? r.maximo;
    return single != null ? `${moneda} ${this.formatNumber(single)}` : null;
  }

  publicado(offer: OfferItem): string | null {
    return this.relativeTime(offer.createdAt);
  }

  vence(offer: OfferItem): string | null {
    return this.relativeTime(offer.fechaLimite);
  }

  trackById(_index: number, offer: OfferItem): string {
    return offer.id;
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('es-PE').format(value);
  }

  /** "hace 3 días" / "en 5 días" a partir de un ISO. */
  private relativeTime(iso: string | null): string | null {
    if (!iso) return null;

    const target = Date.parse(iso);
    if (Number.isNaN(target)) return null;

    const days = Math.round((target - Date.now()) / 86_400_000);
    if (days === 0) return 'hoy';
    if (days === 1) return 'mañana';
    if (days === -1) return 'ayer';

    return days > 0 ? `en ${days} días` : `hace ${Math.abs(days)} días`;
  }

  private getRecruiterId(): string | null {
    return localStorage.getItem('userId');
  }
}
