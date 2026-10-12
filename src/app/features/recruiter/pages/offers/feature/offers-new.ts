import { Component, OnInit, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OfferStore } from '@features/recruiter/pages/offers/data-access/state/offer.store';
import { CompanyStore } from '@features/recruiter/pages/company/data-access/state/company.store';
import { VacancyInput } from '@features/recruiter/pages/offers/domain/models/vacancy.model';
import { ToastService } from '@core/services/toast.service';

interface OfferForm {
  titulo: string;
  descripcion: string;
  tecnologias: string;
  modalidad: string;
  tipoContrato: string;
  nivelExperiencia: string;
  ubicacion: string;
  moneda: string;
  minimo: number | null;
  maximo: number | null;
  fechaLimite: string;
}

@Component({
  selector: 'app-recruiter-offers-new',
  imports: [FormsModule],
  templateUrl: './offers-new.html',
  styleUrl: './offers-new.scss',
})
export class RecruiterOffersNew implements OnInit {
  private readonly store = inject(OfferStore);
  private readonly companyStore = inject(CompanyStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  /**
   * Solo la empresa del propio reclutador. Antes el selector listaba todas las
   * empresas, lo que permitía publicar a nombre de una ajena.
   */
  readonly miEmpresa = this.companyStore.myCompany;
  readonly saving = this.store.saving;

  /** Solo hay elección si existe una empresa propia. */
  readonly independiente = signal(false);

  form: OfferForm = RecruiterOffersNew.emptyForm();

  ngOnInit(): void {
    const recruiterId = this.getRecruiterId();
    if (!recruiterId) {
      this.toast.error('No se identificó al reclutador');
      return;
    }

    this.companyStore.loadMyCompany(recruiterId).subscribe({
      next: company => this.independiente.set(!company),
      error: () => this.independiente.set(true),
    });
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }
    this.router.navigate(['/recruiter/offers']);
  }

  goToCompany(): void {
    this.router.navigate(['/recruiter/company']);
  }

  submit(): void {
    const recruiterId = this.getRecruiterId();
    if (!recruiterId) {
      this.toast.error('No se identificó al reclutador');
      return;
    }

    const validation = this.validate();
    if (validation) {
      this.toast.error(validation);
      return;
    }

    this.store.create(recruiterId, this.buildInput()).subscribe({
      next: () => {
        this.toast.success('Oferta publicada');
        this.router.navigate(['/recruiter/offers']);
      },
      error: () => this.toast.error('No se pudo publicar la oferta'),
    });
  }

  // -------------------------------------------------------------- helpers

  private buildInput(): Omit<VacancyInput, 'recruiterId'> {
    return {
      companyId: this.independiente() ? undefined : (this.miEmpresa()?.id ?? undefined),
      titulo: this.form.titulo.trim(),
      descripcion: this.form.descripcion.trim() || undefined,
      tecnologias: this.splitList(this.form.tecnologias),
      modalidad: this.form.modalidad || undefined,
      tipoContrato: this.form.tipoContrato || undefined,
      nivelExperiencia: this.form.nivelExperiencia.trim() || undefined,
      ubicacion: this.form.ubicacion.trim() || undefined,
      remuneracion: this.buildRemuneracion(),
      fechaLimite: this.form.fechaLimite || undefined,
    };
  }

  private validate(): string | null {
    if (!this.independiente() && !this.miEmpresa()) {
      return 'Crea tu empresa o publica como independiente';
    }

    if (!this.form.titulo.trim()) return 'La oferta necesita título';
    if (!this.form.fechaLimite) return 'La oferta necesita fecha límite';
    if (!this.form.modalidad) return 'La oferta necesita modalidad';
    if (this.splitList(this.form.tecnologias).length === 0) {
      return 'La oferta activa requiere al menos una tecnología';
    }

    const remota = this.form.modalidad === 'REMOTO';
    if (!this.form.ubicacion.trim() && !remota) {
      return 'La oferta necesita ubicación, a menos que sea remota';
    }

    return null;
  }

  private buildRemuneracion():
    | { moneda: string; minimo?: number; maximo?: number }
    | undefined {
    if (this.form.minimo == null && this.form.maximo == null) return undefined;
    return {
      moneda: this.form.moneda,
      minimo: this.form.minimo ?? undefined,
      maximo: this.form.maximo ?? undefined,
    };
  }

  private splitList(value: string): string[] {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }

  private getRecruiterId(): string | null {
    return localStorage.getItem('userId');
  }

  private static emptyForm(): OfferForm {
    return {
      titulo: '',
      descripcion: '',
      tecnologias: '',
      modalidad: 'REMOTO',
      tipoContrato: 'TIEMPO_COMPLETO',
      nivelExperiencia: '',
      ubicacion: '',
      moneda: 'PEN',
      minimo: null,
      maximo: null,
      fechaLimite: '',
    };
  }
}
