import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '@core/services/toast.service';
import { ConfirmModal } from '@shared/ui/confirm-modal/confirm-modal';
import { ApplicationStore } from '@features/developer/postulaciones/data-access/state/application.store';
import {
  Application,
  ESTADO_CLASES,
  ESTADO_LABELS,
  esActiva,
} from '@features/developer/postulaciones/domain/models/application.model';

/** "Mis postulaciones": el historial de ofertas a las que postuló el developer. */
@Component({
  selector: 'app-mis-postulaciones',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmModal],
  templateUrl: './mis-postulaciones.html',
  styleUrl: './mis-postulaciones.scss',
})
export class MisPostulaciones implements OnInit {
  private readonly store = inject(ApplicationStore);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toast = inject(ToastService);

  readonly applications = this.store.applications;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  readonly withdrawOpen = signal(false);
  private readonly pendingId = signal<string | null>(null);

  ngOnInit(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.store.load(userId);
    } else {
      this.store.error.set('Inicia sesión para ver tus postulaciones');
    }
  }

  // ------------------------------------------------------------- acciones

  pedirRetiro(application: Application): void {
    this.pendingId.set(application.id);
    this.withdrawOpen.set(true);
  }

  retirarPostulacion(): void {
    const id = this.pendingId();
    this.withdrawOpen.set(false);
    this.pendingId.set(null);
    if (!id) return;

    this.store.withdrawApplication(id).subscribe({
      next: (ok) =>
        ok ? this.toast.success('Postulación retirada') : this.toast.error('No se pudo retirar la postulación'),
      error: () => this.toast.error('No se pudo retirar la postulación'),
    });
  }

  cerrarConfirm(): void {
    this.withdrawOpen.set(false);
    this.pendingId.set(null);
  }

  verVacante(application: Application): void {
    const id = application.vacancy?.id || application.vacancyId;
    if (id) this.router.navigate(['/developer/vacantes', id]);
  }

  // --------------------------------------------------------------- formato

  titulo(application: Application): string {
    return application.vacancy?.titulo ?? 'Vacante no disponible';
  }

  empresa(application: Application): string {
    return application.vacancy?.company?.nombre?.trim() || 'Sin empresa';
  }

  estadoLabel(estado: string): string {
    return ESTADO_LABELS[estado] ?? estado;
  }

  estadoClass(estado: string): string {
    return ESTADO_CLASES[estado] ?? '';
  }

  activa(estado: string): boolean {
    return esActiva(estado);
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/developer/inicio']);
    }
  }
}
