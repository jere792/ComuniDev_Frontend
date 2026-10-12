import { Component, OnInit, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CompanyStore } from '@features/recruiter/pages/company/data-access/state/company.store';
import { Company } from '@features/recruiter/pages/company/domain/models/company.model';
import { ToastService } from '@core/services/toast.service';

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente de verificación',
  VERIFICADA: 'Verificada',
  RECHAZADA: 'Rechazada',
};

const ESTADO_CLASES: Record<string, string> = {
  PENDIENTE: 'pending',
  VERIFICADA: 'verified',
  RECHAZADA: 'rejected',
};

interface CompanyForm {
  nombre: string;
  descripcion: string;
  sector: string;
  sitioWeb: string;
  logoUrl: string;
  bannerUrl: string;
  pais: string;
  ciudad: string;
  distrito: string;
  direccion: string;
  email: string;
  telefono: string;
  linkedin: string;
  github: string;
}

@Component({
  selector: 'app-recruiter-company',
  imports: [FormsModule],
  templateUrl: './company.html',
  styleUrl: './company.scss',
})
export class RecruiterCompany implements OnInit {
  private readonly store = inject(CompanyStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly company = this.store.myCompany;
  readonly loading = this.store.loading;
  readonly saving = this.store.saving;
  readonly error = this.store.error;
  readonly isNew = signal(true);

  form: CompanyForm = RecruiterCompany.emptyForm();

  ngOnInit(): void {
    const recruiterId = this.getRecruiterId();
    if (!recruiterId) {
      this.store.error.set('No se identificó al reclutador');
      return;
    }

    this.store.loadMyCompany(recruiterId).subscribe({
      next: company => {
        this.isNew.set(!company);
        this.form = RecruiterCompany.toForm(company);
      },
      error: () => this.store.error.set('No se pudo cargar la empresa'),
    });
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }
    this.router.navigate(['/recruiter/offers']);
  }

  submit(): void {
    const recruiterId = this.getRecruiterId();
    if (!recruiterId) {
      this.toast.error('No se identificó al reclutador');
      return;
    }

    if (!this.form.nombre.trim()) {
      this.toast.error('La empresa necesita nombre');
      return;
    }
    if (!this.form.email.trim()) {
      this.toast.error('La empresa necesita correo de contacto');
      return;
    }
    if (!this.form.pais.trim()) {
      this.toast.error('La empresa necesita país');
      return;
    }

    this.store.save(recruiterId, this.company()?.id ?? null, this.buildInput()).subscribe({
      next: () => this.toast.success('Empresa guardada'),
      error: () => this.toast.error('No se pudo guardar la empresa'),
    });
  }

  estadoLabel(value: string | null): string {
    return value ? (ESTADO_LABELS[value] ?? value) : '';
  }

  estadoClass(value: string | null): string {
    return value ? (ESTADO_CLASES[value] ?? '') : '';
  }

  trackById(_index: number, company: { id: string }): string {
    return company.id;
  }

  // -------------------------------------------------------------- helpers

  private buildInput() {
    return {
      nombre: this.form.nombre.trim(),
      descripcion: this.form.descripcion.trim() || undefined,
      sector: this.form.sector.trim() || undefined,
      sitioWeb: this.form.sitioWeb.trim() || undefined,
      logoUrl: this.form.logoUrl.trim() || undefined,
      bannerUrl: this.form.bannerUrl.trim() || undefined,
      ubicacion: {
        pais: this.form.pais.trim(),
        ciudad: this.form.ciudad.trim(),
        distrito: this.form.distrito.trim(),
        direccion: this.form.direccion.trim(),
      },
      contacto: {
        email: this.form.email.trim(),
        telefono: this.form.telefono.trim(),
      },
      redes: {
        linkedin: this.form.linkedin.trim(),
        github: this.form.github.trim(),
      },
    };
  }

  private getRecruiterId(): string | null {
    return localStorage.getItem('userId');
  }

  private static toForm(company: Company | null): CompanyForm {
    if (!company) return RecruiterCompany.emptyForm();

    return {
      nombre: company.nombre,
      descripcion: company.descripcion ?? '',
      sector: company.sector ?? '',
      sitioWeb: company.sitioWeb ?? '',
      logoUrl: company.logoUrl ?? '',
      bannerUrl: company.bannerUrl ?? '',
      pais: company.ubicacion?.pais ?? '',
      ciudad: company.ubicacion?.ciudad ?? '',
      distrito: company.ubicacion?.distrito ?? '',
      direccion: company.ubicacion?.direccion ?? '',
      email: company.contacto?.email ?? '',
      telefono: company.contacto?.telefono ?? '',
      linkedin: company.redes?.linkedin ?? '',
      github: company.redes?.github ?? '',
    };
  }

  private static emptyForm(): CompanyForm {
    return {
      nombre: '',
      descripcion: '',
      sector: '',
      sitioWeb: '',
      logoUrl: '',
      bannerUrl: '',
      pais: '',
      ciudad: '',
      distrito: '',
      direccion: '',
      email: '',
      telefono: '',
      linkedin: '',
      github: '',
    };
  }
}
