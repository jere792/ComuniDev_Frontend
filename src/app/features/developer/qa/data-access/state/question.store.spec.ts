import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { Answer, Question } from '@features/developer/qa/domain/models/question.model';
import {
  QUESTION_REPOSITORY,
  QuestionRepository,
} from '@features/developer/qa/domain/ports/question.repository';
import { QuestionStore } from './question.store';

const pregunta: Question = {
  id: 'q1',
  autorId: 'autor1',
  titulo: '¿Cómo funciona un signal en Angular?',
  descripcion: 'Quiero entender la detección de cambios.',
  codigoEjemplo: null,
  etiquetas: ['Angular'],
  categoria: 'Frontend',
  estado: 'ABIERTA',
  respuestaAceptadaId: null,
  votosCount: 3,
  respuestasCount: 1,
  vistasCount: 10,
  oculto: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: null,
};

const respuesta: Answer = {
  id: 'a1',
  questionId: 'q1',
  autorId: 'autor2',
  contenido: 'Los signals notifican a los consumidores.',
  codigoEjemplo: null,
  votosCount: 1,
  aceptada: false,
  oculto: false,
  createdAt: '2026-01-02T00:00:00Z',
  updatedAt: null,
};

describe('QuestionStore', () => {
  const fake = {
    questions: [pregunta] as Question[],
    answers: [respuesta] as Answer[],
    lastFilters: null as Record<string, unknown> | null,
    lastPage: null as number | null,
    votes: [] as Array<[string, string, number]>,
  };

  const repository: QuestionRepository = {
    questions: (filters, page) => {
      fake.lastFilters = filters as Record<string, unknown>;
      fake.lastPage = page ?? 0;
      return of(fake.questions);
    },
    question: () => of(pregunta),
    answers: () => of(fake.answers),
    myQuestions: () => of(fake.questions),
    createQuestion: () => of(pregunta),
    updateQuestion: () => of(pregunta),
    deleteQuestion: () => of(true),
    createAnswer: () => of(respuesta),
    updateAnswer: () => of(respuesta),
    deleteAnswer: () => of(true),
    voteQuestion: (questionId, userId, valor) => {
      fake.votes.push([questionId, userId, valor]);
      return of(true);
    },
    voteAnswer: (answerId, userId, valor) => {
      fake.votes.push([answerId, userId, valor]);
      return of(true);
    },
    acceptAnswer: () => of(pregunta),
  };

  let store: QuestionStore;

  beforeEach(() => {
    fake.lastFilters = null;
    fake.lastPage = null;
    fake.votes = [];
    localStorage.removeItem('qa:voto:question:q1');
    localStorage.removeItem('qa:voto:answer:a1');

    TestBed.configureTestingModule({
      providers: [{ provide: QUESTION_REPOSITORY, useValue: repository }],
    });
    store = TestBed.inject(QuestionStore);
  });

  it('carga la primera pagina y envia la busqueda como filtro', () => {
    store.load();

    expect(store.questions().length).toBe(1);
    expect(store.page()).toBe(0);
    expect(store.hasMore()).toBe(false);

    store.aplicarBusqueda('  signals  ');

    expect(fake.lastFilters).toEqual({ q: 'signals' });
    expect(fake.lastPage).toBe(0);
  });

  it('ajusta el contador de votos por el delta al cambiar el voto', async () => {
    store.loadDetail('q1');
    await Promise.resolve();

    expect(store.detail()?.votosCount).toBe(3);

    await firstValueFrom(store.votarPregunta('q1', 'u2', 1));
    expect(store.miVotoPregunta()).toBe(1);
    expect(store.detail()?.votosCount).toBe(4);

    // cambia de +1 a -1: el backend resta 2
    await firstValueFrom(store.votarPregunta('q1', 'u2', -1));
    expect(store.detail()?.votosCount).toBe(2);

    // repite el mismo voto: no mueve el contador
    await firstValueFrom(store.votarPregunta('q1', 'u2', -1));
    expect(store.detail()?.votosCount).toBe(2);
    expect(fake.votes).toEqual([
      ['q1', 'u2', 1],
      ['q1', 'u2', -1],
      ['q1', 'u2', -1],
    ]);
  });

  it('vota una respuesta y recuerda el voto para el siguiente clic', async () => {
    store.loadAnswers('q1');
    await Promise.resolve();

    await firstValueFrom(store.votarRespuesta('a1', 'u2', 1));

    expect(store.answers()[0].votosCount).toBe(2);
    expect(store.misVotosRespuestas()['a1']).toBe(1);
  });
});
