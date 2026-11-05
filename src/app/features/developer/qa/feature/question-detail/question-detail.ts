import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ToastService } from '@core/services/toast.service';
import { ConfirmModal } from '@shared/ui/confirm-modal/confirm-modal';
import { TagInputComponent } from '@shared/ui/tag-input/tag-input';
import { QuestionStore } from '@features/developer/qa/data-access/state/question.store';
import { QaAuthorStore } from '@features/developer/qa/data-access/state/qa-author.store';
import {
  Answer,
  CATEGORIAS_QA,
  estadoClase,
  estadoLabel,
  iniciales,
} from '@features/developer/qa/domain/models/question.model';

/**
 * Detalle de una pregunta: cuerpo y código, votos, respuestas ordenadas por
 * votos, aceptación de la solución y edición/borrado del contenido propio.
 */
@Component({
  selector: 'app-question-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModal, TagInputComponent],
  templateUrl: './question-detail.html',
  styleUrl: './question-detail.scss',
})
export class QuestionDetail implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toast = inject(ToastService);
  readonly store = inject(QuestionStore);
  private readonly authors = inject(QaAuthorStore);

  readonly question = this.store.detail;
  readonly answers = this.store.answers;
  readonly loading = this.store.detailLoading;
  readonly error = this.store.detailError;
  readonly answersLoading = this.store.answersLoading;
  readonly answersError = this.store.answersError;

  readonly miUserId = localStorage.getItem('userId') ?? '';
  readonly categorias = CATEGORIAS_QA;

  estadoLabel = estadoLabel;
  estadoClase = estadoClase;
  iniciales = iniciales;

  private questionId = '';

  readonly esMia = computed(() => {
    const question = this.question();
    return !!question && !!this.miUserId && question.autorId === this.miUserId;
  });

  readonly esCerrada = computed(() => this.question()?.estado === 'CERRADA');

  // Pregunta: edición y borrado.
  readonly editandoPregunta = signal(false);
  readonly guardandoPregunta = signal(false);
  editTitulo = '';
  editDescripcion = '';
  editCodigo = '';
  editCategoria = '';
  editEtiquetas: string[] = [];

  readonly deleteQuestionOpen = signal(false);
  readonly eliminandoPregunta = signal(false);

  // Votos y aceptación.
  readonly votandoPregunta = signal(false);
  readonly votandoRespuesta = signal<string | null>(null);
  readonly aceptando = signal<string | null>(null);

  // Formulario de respuesta.
  respuestaContenido = '';
  respuestaCodigo = '';
  readonly enviandoRespuesta = signal(false);

  // Edición y borrado de respuestas.
  readonly editandoRespuestaId = signal<string | null>(null);
  editRespuestaContenido = '';
  editRespuestaCodigo = '';
  readonly guardandoRespuesta = signal(false);

  readonly deleteAnswerOpen = signal(false);
  readonly respuestaAEliminar = signal<Answer | null>(null);
  readonly eliminandoRespuesta = signal(false);

  constructor() {
    effect(() => {
      const question = this.question();
      const answers = this.answers();
      const ids = [question?.autorId, ...answers.map((answer) => answer.autorId)].filter(
        (id): id is string => !!id,
      );
      this.authors.resolver(ids);
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!id) {
      this.router.navigate(['/developer/preguntas']);
      return;
    }
    this.questionId = id;
    this.store.loadDetail(id);
  }

  ngOnDestroy(): void {
    this.store.limpiarDetalle();
  }

  // ------------------------------------------------------------- autores

  autorNombre(autorId: string): string {
    if (autorId === this.miUserId) return 'Tú';
    return this.authors.nombre(autorId);
  }

  autorUsuario(autorId: string): string {
    if (autorId === this.miUserId) return '';
    return this.authors.usuario(autorId);
  }

  fotoAutor(autorId: string): string | null {
    return this.authors.foto(autorId);
  }

  // ------------------------------------------------------- pregunta propia

  abrirEdicionPregunta(): void {
    const question = this.question();
    if (!question) return;
    this.editTitulo = question.titulo;
    this.editDescripcion = question.descripcion;
    this.editCodigo = question.codigoEjemplo ?? '';
    this.editCategoria = question.categoria ?? '';
    this.editEtiquetas = [...question.etiquetas];
    this.editandoPregunta.set(true);
  }

  cancelarEdicionPregunta(): void {
    this.editandoPregunta.set(false);
  }

  guardarPregunta(): void {
    if (!this.miUserId) {
      this.toast.error('Inicia sesión para editar la pregunta');
      return;
    }
    const titulo = this.editTitulo.trim();
    const descripcion = this.editDescripcion.trim();
    if (titulo.length < 10) {
      this.toast.error('El título debe tener al menos 10 caracteres');
      return;
    }
    if (!descripcion) {
      this.toast.error('La descripción es obligatoria');
      return;
    }
    if (!this.editEtiquetas.length) {
      this.toast.error('Indica al menos una etiqueta');
      return;
    }

    this.guardandoPregunta.set(true);
    this.store
      .actualizarPregunta(this.questionId, this.miUserId, {
        titulo,
        descripcion,
        codigoEjemplo: this.editCodigo,
        etiquetas: [...this.editEtiquetas],
        categoria: this.editCategoria.trim(),
      })
      .pipe(finalize(() => this.guardandoPregunta.set(false)))
      .subscribe({
        next: (question) => {
          if (!question) {
            this.toast.error('No se pudo actualizar la pregunta');
            return;
          }
          this.editandoPregunta.set(false);
          this.toast.success('Pregunta actualizada');
        },
        error: (err) => this.toast.error(this.mensajeError(err, 'No se pudo actualizar la pregunta')),
      });
  }

  pedirEliminarPregunta(): void {
    this.deleteQuestionOpen.set(true);
  }

  cerrarEliminarPregunta(): void {
    this.deleteQuestionOpen.set(false);
  }

  confirmarEliminarPregunta(): void {
    if (!this.miUserId) return;
    this.deleteQuestionOpen.set(false);
    this.eliminandoPregunta.set(true);
    this.store
      .eliminarPregunta(this.questionId, this.miUserId)
      .pipe(finalize(() => this.eliminandoPregunta.set(false)))
      .subscribe({
        next: (ok) => {
          if (!ok) {
            this.toast.error('No se pudo eliminar la pregunta');
            return;
          }
          this.toast.success('Pregunta eliminada');
          this.router.navigate(['/developer/preguntas']);
        },
        error: (err) => this.toast.error(this.mensajeError(err, 'No se pudo eliminar la pregunta')),
      });
  }

  // --------------------------------------------------------------- votos

  votarPregunta(valor: 1 | -1): void {
    if (!this.miUserId) {
      this.toast.error('Inicia sesión para votar');
      return;
    }
    if (this.esMia() || this.votandoPregunta()) return;

    this.votandoPregunta.set(true);
    this.store
      .votarPregunta(this.questionId, this.miUserId, valor)
      .pipe(finalize(() => this.votandoPregunta.set(false)))
      .subscribe({
        error: (err) => this.toast.error(this.mensajeError(err, 'No se pudo registrar el voto')),
      });
  }

  votarRespuesta(answer: Answer, valor: 1 | -1): void {
    if (!this.miUserId) {
      this.toast.error('Inicia sesión para votar');
      return;
    }
    if (answer.autorId === this.miUserId || this.votandoRespuesta()) return;

    this.votandoRespuesta.set(answer.id);
    this.store
      .votarRespuesta(answer.id, this.miUserId, valor)
      .pipe(finalize(() => this.votandoRespuesta.set(null)))
      .subscribe({
        error: (err) => this.toast.error(this.mensajeError(err, 'No se pudo registrar el voto')),
      });
  }

  miVotoRespuesta(answerId: string): 1 | -1 | null {
    return this.store.misVotosRespuestas()[answerId] ?? null;
  }

  // ----------------------------------------------------- aceptar solución

  esAceptada(answer: Answer): boolean {
    return answer.aceptada || this.question()?.respuestaAceptadaId === answer.id;
  }

  puedeAceptar(answer: Answer): boolean {
    return this.esMia() && !this.esCerrada() && !this.esAceptada(answer);
  }

  aceptarSolucion(answer: Answer): void {
    if (!this.miUserId || !this.puedeAceptar(answer) || this.aceptando()) return;

    this.aceptando.set(answer.id);
    this.store
      .aceptarRespuesta(this.questionId, answer.id, this.miUserId)
      .pipe(finalize(() => this.aceptando.set(null)))
      .subscribe({
        next: (question) => {
          if (!question) {
            this.toast.error('No se pudo aceptar la respuesta');
            return;
          }
          this.toast.success('Solución aceptada');
        },
        error: (err) => this.toast.error(this.mensajeError(err, 'No se pudo aceptar la respuesta')),
      });
  }

  // ------------------------------------------------------------ responder

  publicarRespuesta(): void {
    if (!this.miUserId) {
      this.toast.error('Inicia sesión para responder');
      return;
    }
    const contenido = this.respuestaContenido.trim();
    if (!contenido) {
      this.toast.error('La respuesta no puede estar vacía');
      return;
    }

    this.enviandoRespuesta.set(true);
    this.store
      .crearRespuesta(this.questionId, this.miUserId, contenido, this.respuestaCodigo)
      .pipe(finalize(() => this.enviandoRespuesta.set(false)))
      .subscribe({
        next: (answer) => {
          if (!answer) {
            this.toast.error('No se pudo publicar la respuesta');
            return;
          }
          this.respuestaContenido = '';
          this.respuestaCodigo = '';
          this.toast.success('Respuesta publicada');
        },
        error: (err) => this.toast.error(this.mensajeError(err, 'No se pudo publicar la respuesta')),
      });
  }

  // ---------------------------------------------- editar respuesta propia

  esMiRespuesta(answer: Answer): boolean {
    return !!this.miUserId && answer.autorId === this.miUserId;
  }

  editarRespuesta(answer: Answer): void {
    this.editandoRespuestaId.set(answer.id);
    this.editRespuestaContenido = answer.contenido;
    this.editRespuestaCodigo = answer.codigoEjemplo ?? '';
  }

  cancelarEdicionRespuesta(): void {
    this.editandoRespuestaId.set(null);
    this.editRespuestaContenido = '';
    this.editRespuestaCodigo = '';
  }

  guardarRespuesta(): void {
    const id = this.editandoRespuestaId();
    if (!id || !this.miUserId) return;
    const contenido = this.editRespuestaContenido.trim();
    if (!contenido) {
      this.toast.error('La respuesta no puede estar vacía');
      return;
    }

    this.guardandoRespuesta.set(true);
    this.store
      .actualizarRespuesta(id, this.miUserId, contenido, this.editRespuestaCodigo)
      .pipe(finalize(() => this.guardandoRespuesta.set(false)))
      .subscribe({
        next: (answer) => {
          if (!answer) {
            this.toast.error('No se pudo actualizar la respuesta');
            return;
          }
          this.cancelarEdicionRespuesta();
          this.toast.success('Respuesta actualizada');
        },
        error: (err) => this.toast.error(this.mensajeError(err, 'No se pudo actualizar la respuesta')),
      });
  }

  pedirEliminarRespuesta(answer: Answer): void {
    this.respuestaAEliminar.set(answer);
    this.deleteAnswerOpen.set(true);
  }

  cerrarEliminarRespuesta(): void {
    this.deleteAnswerOpen.set(false);
    this.respuestaAEliminar.set(null);
  }

  confirmarEliminarRespuesta(): void {
    const answer = this.respuestaAEliminar();
    if (!answer || !this.miUserId) return;

    this.deleteAnswerOpen.set(false);
    this.eliminandoRespuesta.set(true);
    this.store
      .eliminarRespuesta(answer.id, this.miUserId)
      .pipe(finalize(() => this.eliminandoRespuesta.set(false)))
      .subscribe({
        next: (ok) => {
          this.respuestaAEliminar.set(null);
          if (!ok) {
            this.toast.error('No se pudo eliminar la respuesta');
            return;
          }
          this.toast.success('Respuesta eliminada');
        },
        error: (err) => {
          this.respuestaAEliminar.set(null);
          this.toast.error(this.mensajeError(err, 'No se pudo eliminar la respuesta'));
        },
      });
  }

  // ------------------------------------------------------------- navegar

  volver(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/developer/preguntas']);
    }
  }

  // -------------------------------------------------------------- helper

  private mensajeError(error: unknown, fallback: string): string {
    const err = error as {
      message?: string;
      graphQLErrors?: Array<{ message?: string }>;
    };
    return err?.graphQLErrors?.[0]?.message ?? err?.message ?? fallback;
  }
}
