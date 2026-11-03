import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '@core/services/toast.service';
import { ChallengeStore } from '@features/developer/retos/data-access/state/challenge.store';
import {
  ChallengeSubmission,
  dificultadLabel,
  estadoMeta,
  letraOpcion,
} from '@features/developer/retos/domain/models/challenge.model';

/** Reto diario: pregunta teórica o ejercicio de código con feedback de la IA. */
@Component({
  selector: 'app-reto-diario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reto-diario.html',
  styleUrl: './reto-diario.scss',
})
export class RetoDiario implements OnInit {
  private readonly store = inject(ChallengeStore);
  private readonly toast = inject(ToastService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  readonly challenge = this.store.challenge;
  readonly submission = this.store.submission;
  readonly history = this.store.history;
  readonly loading = this.store.loading;
  readonly submitting = this.store.submitting;
  readonly error = this.store.error;

  readonly seleccion = signal<number | null>(null);
  readonly codigo = signal('');
  readonly solucionAbierta = signal(false);
  readonly mostrarHistorico = signal(false);

  readonly miUserId = localStorage.getItem('userId') ?? '';

  estadoMeta = estadoMeta;
  dificultadLabel = dificultadLabel;
  letraOpcion = letraOpcion;

  readonly esTeorico = computed(() => this.challenge()?.tipo === 'TEORICO');
  readonly esCodigo = computed(() => this.challenge()?.tipo === 'CODIGO');

  /** Ya respondió: el formulario se sustituye por el resultado. */
  readonly respondido = computed(() => !!this.submission());

  readonly fechaHoy = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  ngOnInit(): void {
    if (!this.miUserId) {
      this.error.set('Inicia sesión para resolver el reto del día');
      return;
    }
    this.store.load(null, this.miUserId);
    this.store.loadHistory(this.miUserId);
  }

  // -------------------------------------------------------------- envío

  responder(): void {
    const challenge = this.challenge();
    if (!challenge || !this.miUserId) return;

    if (this.esTeorico()) {
      if (this.seleccion() == null) {
        this.toast.error('Elige una opción antes de responder');
        return;
      }
      this.enviar(this.seleccion(), null);
      return;
    }

    const codigo = this.codigo().trim();
    if (!codigo) {
      this.toast.error('Escribe tu solución antes de enviarla');
      return;
    }
    this.enviar(null, codigo);
  }

  private enviar(respuesta: number | null, codigo: string | null): void {
    const challenge = this.challenge();
    if (!challenge) return;

    this.store.submit(this.miUserId, challenge.id, respuesta, codigo).subscribe({
      next: (submission) => {
        if (submission) {
          this.toast.success(
            submission.estado === 'CORRECTA'
              ? `¡Correcta! +${submission.puntosOtorgados ?? 0} puntos`
              : 'Respuesta registrada',
          );
        } else {
          this.toast.error('No se pudo enviar la respuesta');
        }
      },
      error: (err) => this.toast.error(err?.error?.message ?? 'No se pudo enviar la respuesta'),
    });
  }

  // ------------------------------------------------------------ controles

  elegirOpcion(indice: number): void {
    if (this.respondido()) return;
    this.seleccion.set(indice);
  }

  escribirCodigo(event: Event): void {
    this.codigo.set((event.target as HTMLTextAreaElement).value);
  }

  toggleSolucion(): void {
    this.solucionAbierta.update((abierto) => !abierto);
  }

  toggleHistorico(): void {
    this.mostrarHistorico.update((abierto) => !abierto);
  }

  reiniciar(): void {
    this.seleccion.set(null);
    this.codigo.set('');
    this.solucionAbierta.set(false);
    this.store.load(null, this.miUserId);
  }

  vuelve(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/developer/inicio']);
    }
  }

  // ------------------------------------------------------------- formato

  /** El backend expone la solución solo tras responder. */
  solucionVisible(): string | null {
    return this.submission()?.challenge?.solucionReferencia ?? this.challenge()?.solucionReferencia ?? null;
  }

  explicacionVisible(): string | null {
    return this.submission()?.challenge?.explicacion ?? this.challenge()?.explicacion ?? null;
  }

  /** Respuesta elegida en el teórico, ya sea la tuya o la correcta revelada. */
  opcionElegida(): number | null {
    const sub = this.submission();
    if (sub?.respuesta != null) return sub.respuesta;
    return this.seleccion();
  }

  opcionCorrecta(): number | null {
    return this.submission()?.challenge?.respuestaCorrecta ?? this.challenge()?.respuestaCorrecta ?? null;
  }

  fechaDe(submission: ChallengeSubmission): string {
    return submission.createdAt ?? '';
  }

  tituloDe(submission: ChallengeSubmission): string {
    return submission.challenge?.titulo ?? 'Reto';
  }
}
