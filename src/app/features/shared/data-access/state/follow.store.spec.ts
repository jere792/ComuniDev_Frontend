import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { FOLLOW_REPOSITORY, FollowRepository, FollowRequest } from '@features/shared/domain/ports/follow.repository';
import { FollowEdge } from '@features/shared/domain/models/follow.model';
import { FollowStore } from './follow.store';

describe('FollowStore', () => {
  // repo falso: registra cada llamada y devuelve lo que el test configure
  const fake = {
    followResult: null as FollowEdge | null,
    followArgs: null as unknown[] | null,
    requests: [{ id: 'r1', seguidorId: 'u1', seguidoId: 'yo', estado: 'PENDIENTE' }] as FollowRequest[],
    followRequestsArgs: null as unknown[] | null,
    calls: [] as string[],
  };

  let store: FollowStore;

  beforeEach(() => {
    fake.followResult = null;
    fake.followArgs = null;
    fake.followRequestsArgs = null;
    fake.calls = [];

    const repository: FollowRepository = {
      follow: (seguidorId, seguidoId) => {
        fake.followArgs = [seguidorId, seguidoId];
        fake.calls.push('follow');
        return of(fake.followResult);
      },
      unfollow: () => {
        fake.calls.push('unfollow');
        return of(true);
      },
      isFollowing: () => of(false),
      getFollowers: () => of([]),
      getFollowing: () => of([]),
      getFollowRequests: (userId) => {
        fake.followRequestsArgs = [userId];
        fake.calls.push('getFollowRequests');
        return of(fake.requests);
      },
      acceptFollowRequest: (requestId) => {
        fake.calls.push(`acceptFollowRequest:${requestId}`);
        return of(true);
      },
      rejectFollowRequest: (requestId) => {
        fake.calls.push(`rejectFollowRequest:${requestId}`);
        return of(false);
      },
    };

    TestBed.configureTestingModule({
      providers: [{ provide: FOLLOW_REPOSITORY, useValue: repository }],
    });
    store = TestBed.inject(FollowStore);
  });

  it('pasa el null del backend tal cual: perfil privado = solicitud enviada', async () => {
    fake.followResult = null;

    const resultado = await firstValueFrom(store.follow('yo', 'otro'));

    expect(resultado).toBeNull();
    expect(fake.followArgs).toEqual(['yo', 'otro']);
  });

  it('devuelve el follow cuando el perfil es publico', async () => {
    fake.followResult = { id: 'f1' } as unknown as FollowEdge;

    const resultado = await firstValueFrom(store.follow('yo', 'otro'));

    expect(resultado?.id).toBe('f1');
  });

  it('carga las solicitudes de seguir pendientes del usuario', async () => {
    const solicitudes = await firstValueFrom(store.getFollowRequests('yo'));

    expect(solicitudes.length).toBe(1);
    expect(solicitudes[0].id).toBe('r1');
    expect(fake.followRequestsArgs).toEqual(['yo']);
  });

  it('aceptar y rechazar solicitud llegan al repositorio con el id correcto', async () => {
    const aceptada = await firstValueFrom(store.acceptFollowRequest('r1'));
    const rechazada = await firstValueFrom(store.rejectFollowRequest('r2'));

    expect(aceptada).toBe(true);
    expect(rechazada).toBe(false);
    expect(fake.calls).toContain('acceptFollowRequest:r1');
    expect(fake.calls).toContain('rejectFollowRequest:r2');
  });

  it('loadFollowers llena la senal y baja el loading', async () => {
    store.loadFollowers('yo');
    await Promise.resolve();

    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });
});
