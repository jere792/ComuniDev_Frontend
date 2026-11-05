import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  Answer,
  CATEGORIAS_QA,
  Question,
  QuestionFilters,
  QuestionInput,
  QuestionUpdateInput,
} from '@features/developer/qa/domain/models/question.model';
import {
  QUESTION_REPOSITORY,
  QuestionRepository,
} from '@features/developer/qa/domain/ports/question.repository';

const PAGE_SIZE = 10;
/** El detalle trae la lista completa de respuestas visibles (ya ordenadas por votos). */
const ANSWER_PAGE_SIZE = 100;

/**
 * Estado del módulo Q&A: listado público con filtros y paginación, "mis
 * preguntas", detalle con respuestas y mutaciones. Las mutaciones devuelven el
 * observable para que la página muestre el toast; aquí solo se refresca el
 * estado local.
 */
@Injectable({ providedIn: 'root' })
export class QuestionStore {
  private readonly repository = inject<QuestionRepository>(QUESTION_REPOSITORY);

  // ------------------------------------------------------------- listado
  readonly questions = signal<Question[]>([]);
  readonly page = signal(0);
  readonly hasMore = signal(false);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly error = signal<string | null>(null);

  /** Filtros activos. El estado vacío significa "todas". */
  readonly q = signal('');
  readonly categoria = signal('');
  readonly etiqueta = signal('');
  readonly estado = signal('');

  // -------------------------------------------------------- mis preguntas
  readonly misPreguntas = signal<Question[]>([]);
  readonly misPage = signal(0);
  readonly misHasMore = signal(false);
  readonly misLoading = signal(false);
  readonly misLoadingMore = signal(false);
  readonly misError = signal<string | null>(null);

  // ------------------------------------------------------------- detalle
  readonly detail = signal<Question | null>(null);
  readonly detailLoading = signal(false);
  readonly detailError = signal<string | null>(null);
  readonly answers = signal<Answer[]>([]);
  readonly answersLoading = signal(false);
  readonly answersError = signal<string | null>(null);

  /** Voto del usuario en la pregunta abierta (el backend no lo expone). */
  readonly miVotoPregunta = signal<1 | -1 | null>(null);
  /** Voto del usuario por respuesta, para descontar el voto anterior al cambiarlo. */
  readonly misVotosRespuestas = signal<Record<string, 1 | -1>>({});

  /** Categorías sugeridas + las que ya aparecen en pantalla. */
  readonly categorias = computed<string[]>(() => {
    const vistas = new Set(CATEGORIAS_QA);
    for (const question of this.questions()) {
      if (question.categoria) vistas.add(question.categoria);
    }
    const detalle = this.detail();
    if (detalle?.categoria) vistas.add(detalle.categoria);
    return [...vistas];
  });

  // ------------------------------------------------------------- listado

  /** Primera página con los filtros actuales. */
  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.repository.questions(this.filtros(), 0, PAGE_SIZE).subscribe({
      next: (questions) => {
        this.questions.set(questions);
        this.page.set(0);
        this.hasMore.set(questions.length >= PAGE_SIZE);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las preguntas');
        this.loading.set(false);
      },
    });
  }

  /** Siguiente página, solo si queda algo por traer. */
  loadMore(): void {
    if (this.loading() || this.loadingMore() || !this.hasMore()) return;
    const siguiente = this.page() + 1;
    this.loadingMore.set(true);
    this.repository.questions(this.filtros(), siguiente, PAGE_SIZE).subscribe({
      next: (questions) => {
        this.questions.update((actual) => [...actual, ...questions]);
        this.page.set(siguiente);
        this.hasMore.set(questions.length >= PAGE_SIZE);
        this.loadingMore.set(false);
      },
      error: () => this.loadingMore.set(false),
    });
  }

  aplicarBusqueda(texto: string): void {
    const limpio = texto.trim();
    if (this.q() === limpio) return;
    this.q.set(limpio);
    this.load();
  }

  setCategoria(categoria: string): void {
    if (this.categoria() === categoria) return;
    this.categoria.set(categoria);
    this.load();
  }

  setEtiqueta(etiqueta: string): void {
    const limpia = etiqueta.trim();
    if (this.etiqueta() === limpia) return;
    this.etiqueta.set(limpia);
    this.load();
  }

  setEstado(estado: string): void {
    if (this.estado() === estado) return;
    this.estado.set(estado);
    this.load();
  }

  limpiarFiltros(): void {
    this.q.set('');
    this.categoria.set('');
    this.etiqueta.set('');
    this.estado.set('');
    this.load();
  }

  private filtros(): QuestionFilters {
    return {
      categoria: this.categoria() || undefined,
      etiqueta: this.etiqueta() || undefined,
      estado: this.estado() || undefined,
      q: this.q() || undefined,
    };
  }

  // ------------------------------------------------------- mis preguntas

  loadMisPreguntas(autorId: string): void {
    if (!autorId) {
      this.misError.set('Inicia sesión para ver tus preguntas');
      return;
    }
    this.misLoading.set(true);
    this.misError.set(null);
    this.repository.myQuestions(autorId, 0, PAGE_SIZE).subscribe({
      next: (questions) => {
        this.misPreguntas.set(questions);
        this.misPage.set(0);
        this.misHasMore.set(questions.length >= PAGE_SIZE);
        this.misLoading.set(false);
      },
      error: () => {
        this.misError.set('No se pudieron cargar tus preguntas');
        this.misLoading.set(false);
      },
    });
  }

  loadMoreMisPreguntas(autorId: string): void {
    if (this.misLoading() || this.misLoadingMore() || !this.misHasMore()) return;
    const siguiente = this.misPage() + 1;
    this.misLoadingMore.set(true);
    this.repository.myQuestions(autorId, siguiente, PAGE_SIZE).subscribe({
      next: (questions) => {
        this.misPreguntas.update((actual) => [...actual, ...questions]);
        this.misPage.set(siguiente);
        this.misHasMore.set(questions.length >= PAGE_SIZE);
        this.misLoadingMore.set(false);
      },
      error: () => this.misLoadingMore.set(false),
    });
  }

  // ------------------------------------------------------------- detalle

  loadDetail(id: string): void {
    this.detailLoading.set(true);
    this.detailError.set(null);
    this.detail.set(null);
    this.answers.set([]);
    this.answersError.set(null);
    this.miVotoPregunta.set(this.leerVoto(this.claveVotoPregunta(id)));

    this.repository.question(id).subscribe({
      next: (question) => {
        this.detail.set(question);
        this.detailLoading.set(false);
        if (!question) {
          this.detailError.set('No se encontró la pregunta');
          return;
        }
        this.loadAnswers(question.id);
      },
      error: () => {
        this.detailError.set('No se pudo cargar la pregunta');
        this.detailLoading.set(false);
      },
    });
  }

  loadAnswers(questionId: string): void {
    this.answersLoading.set(true);
    this.answersError.set(null);
    this.repository.answers(questionId, 0, ANSWER_PAGE_SIZE).subscribe({
      next: (answers) => {
        this.answers.set(answers);
        // Recupera el voto propio guardado: el schema no lo expone.
        const votos: Record<string, 1 | -1> = {};
        for (const answer of answers) {
          const voto = this.leerVoto(this.claveVotoRespuesta(answer.id));
          if (voto) votos[answer.id] = voto;
        }
        this.misVotosRespuestas.set(votos);
        this.answersLoading.set(false);
      },
      error: () => {
        this.answersError.set('No se pudieron cargar las respuestas');
        this.answersLoading.set(false);
      },
    });
  }

  // --------------------------------------------------------- mutaciones

  crearPregunta(autorId: string, input: QuestionInput): Observable<Question | null> {
    return this.repository.createQuestion(autorId, input).pipe(
      tap((question) => {
        if (!question) return;
        this.questions.update((actual) => [question, ...actual.filter((item) => item.id !== question.id)]);
        this.misPreguntas.update((actual) => [question, ...actual.filter((item) => item.id !== question.id)]);
      }),
    );
  }

  actualizarPregunta(
    id: string,
    actorId: string,
    input: QuestionUpdateInput,
  ): Observable<Question | null> {
    return this.repository.updateQuestion(id, actorId, input).pipe(
      tap((question) => {
        if (question) this.reemplazarPregunta(question);
      }),
    );
  }

  eliminarPregunta(id: string, actorId: string): Observable<boolean> {
    return this.repository.deleteQuestion(id, actorId).pipe(
      tap((ok) => {
        if (!ok) return;
        this.questions.update((actual) => actual.filter((item) => item.id !== id));
        this.misPreguntas.update((actual) => actual.filter((item) => item.id !== id));
        if (this.detail()?.id === id) this.detail.set(null);
      }),
    );
  }

  crearRespuesta(
    questionId: string,
    autorId: string,
    contenido: string,
    codigoEjemplo?: string,
  ): Observable<Answer | null> {
    return this.repository.createAnswer(questionId, autorId, contenido, codigoEjemplo).pipe(
      tap((answer) => {
        if (!answer) return;
        this.answers.update((actual) => [...actual, answer]);
        this.detail.update((question) =>
          question && question.id === questionId
            ? { ...question, respuestasCount: question.respuestasCount + 1 }
            : question,
        );
        this.loadAnswers(questionId);
      }),
    );
  }

  actualizarRespuesta(
    id: string,
    actorId: string,
    contenido: string,
    codigoEjemplo?: string,
  ): Observable<Answer | null> {
    return this.repository.updateAnswer(id, actorId, contenido, codigoEjemplo).pipe(
      tap((answer) => {
        if (!answer) return;
        this.answers.update((actual) => actual.map((item) => (item.id === answer.id ? answer : item)));
      }),
    );
  }

  eliminarRespuesta(id: string, actorId: string): Observable<boolean> {
    return this.repository.deleteAnswer(id, actorId).pipe(
      tap((ok) => {
        if (!ok) return;
        this.answers.update((actual) => actual.filter((item) => item.id !== id));
        this.detail.update((question) =>
          question
            ? { ...question, respuestasCount: Math.max(0, question.respuestasCount - 1) }
            : question,
        );
      }),
    );
  }

  votarPregunta(questionId: string, userId: string, valor: 1 | -1): Observable<boolean> {
    const anterior = this.miVotoPregunta() ?? 0;
    const delta = valor - anterior;

    return this.repository.voteQuestion(questionId, userId, valor).pipe(
      tap((ok) => {
        if (!ok) return;
        this.miVotoPregunta.set(valor);
        this.guardarVoto(this.claveVotoPregunta(questionId), valor);
        if (delta === 0) return;
        this.detail.update((question) =>
          question && question.id === questionId
            ? { ...question, votosCount: question.votosCount + delta }
            : question,
        );
        this.questions.update((actual) =>
          actual.map((question) =>
            question.id === questionId
              ? { ...question, votosCount: question.votosCount + delta }
              : question,
          ),
        );
        this.misPreguntas.update((actual) =>
          actual.map((question) =>
            question.id === questionId
              ? { ...question, votosCount: question.votosCount + delta }
              : question,
          ),
        );
      }),
    );
  }

  votarRespuesta(answerId: string, userId: string, valor: 1 | -1): Observable<boolean> {
    const anterior = this.misVotosRespuestas()[answerId] ?? 0;
    const delta = valor - anterior;

    return this.repository.voteAnswer(answerId, userId, valor).pipe(
      tap((ok) => {
        if (!ok) return;
        this.misVotosRespuestas.update((actual) => ({ ...actual, [answerId]: valor }));
        this.guardarVoto(this.claveVotoRespuesta(answerId), valor);
        if (delta === 0) return;
        this.answers.update((actual) =>
          actual.map((answer) =>
            answer.id === answerId
              ? { ...answer, votosCount: answer.votosCount + delta }
              : answer,
          ),
        );
      }),
    );
  }

  aceptarRespuesta(questionId: string, answerId: string, actorId: string): Observable<Question | null> {
    return this.repository.acceptAnswer(questionId, answerId, actorId).pipe(
      tap((question) => {
        if (!question) return;
        this.reemplazarPregunta(question);
        this.loadAnswers(questionId);
      }),
    );
  }

  // ------------------------------------------------------------- internos

  private reemplazarPregunta(question: Question): void {
    this.questions.update((actual) =>
      actual.map((item) => (item.id === question.id ? question : item)),
    );
    this.misPreguntas.update((actual) =>
      actual.map((item) => (item.id === question.id ? question : item)),
    );
    if (this.detail()?.id === question.id) this.detail.set(question);
  }

  // El backend no expone el voto del usuario; se guarda en el navegador para
  // que, tras recargar, el siguiente clic mueva el contador por el delta real.
  private claveVotoPregunta(id: string): string {
    return `qa:voto:question:${id}`;
  }

  private claveVotoRespuesta(id: string): string {
    return `qa:voto:answer:${id}`;
  }

  private leerVoto(clave: string): 1 | -1 | null {
    const valor = localStorage.getItem(clave);
    return valor === '1' || valor === '-1' ? (Number(valor) as 1 | -1) : null;
  }

  private guardarVoto(clave: string, valor: 1 | -1): void {
    localStorage.setItem(clave, String(valor));
  }

  /** Limpia solo el detalle al salir de esa pantalla (conserva el listado). */
  limpiarDetalle(): void {
    this.detail.set(null);
    this.detailLoading.set(false);
    this.detailError.set(null);
    this.answers.set([]);
    this.answersLoading.set(false);
    this.answersError.set(null);
    this.miVotoPregunta.set(null);
    this.misVotosRespuestas.set({});
  }

  /** Deja el módulo limpio al salir de las pantallas de Q&A. */
  clear(): void {
    this.questions.set([]);
    this.page.set(0);
    this.hasMore.set(false);
    this.loading.set(false);
    this.loadingMore.set(false);
    this.error.set(null);
    this.q.set('');
    this.categoria.set('');
    this.etiqueta.set('');
    this.estado.set('');
    this.misPreguntas.set([]);
    this.misPage.set(0);
    this.misHasMore.set(false);
    this.misLoading.set(false);
    this.misLoadingMore.set(false);
    this.misError.set(null);
    this.detail.set(null);
    this.detailLoading.set(false);
    this.detailError.set(null);
    this.answers.set([]);
    this.answersLoading.set(false);
    this.answersError.set(null);
    this.miVotoPregunta.set(null);
    this.misVotosRespuestas.set({});
  }
}
