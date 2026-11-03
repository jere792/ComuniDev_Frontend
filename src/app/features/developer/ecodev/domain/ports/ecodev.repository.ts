import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  EcotechImpacto,
  EcotechPost,
  EcotechPostInput,
  EcotechPostsFiltro,
  EcotechTransaction,
  EcotechTransactionsFiltro,
  RecyclingPoint,
} from '@features/developer/ecodev/domain/models/ecodev.model';

export interface EcotechRepository {
  /** Anuncios por filtros (tipo, categoría, estado, página); sin estado solo ACTIVAS. */
  ecotechPosts(filtro?: EcotechPostsFiltro): Observable<EcotechPost[]>;
  /** Anuncio por id; null si no existe. */
  ecotechPost(id: string): Observable<EcotechPost | null>;
  /** Puntos de reciclaje; por defecto solo los VERIFICADOS. */
  recyclingPoints(soloVerificados?: boolean, page?: number, size?: number): Observable<RecyclingPoint[]>;
  /** Transacciones por anuncio y/o participante y/o estado. */
  ecotechTransactions(filtro?: EcotechTransactionsFiltro): Observable<EcotechTransaction[]>;
  /** Impacto ODS 12 (solo COMPLETADA), de todos o de un usuario. */
  ecotechImpacto(userId?: string): Observable<EcotechImpacto | null>;
  /** Crea un anuncio ACTIVA; otorga los puntos únicos ANUNCIO_ECODEV al autor. */
  createEcotechPost(autorId: string, input: EcotechPostInput): Observable<EcotechPost | null>;
  /** Cuenta un interesado más y avisa a su autor. */
  contactEcotechPost(postId: string, userId: string): Observable<EcotechPost | null>;
  /** El interesado inicia la transacción sobre un anuncio ACTIVO ajeno. */
  startEcotechTransaction(postId: string, emisorId: string): Observable<EcotechTransaction | null>;
  /** Confirmación de emisor o receptor; con la segunda pasa a COMPLETADA. */
  confirmEcotechTransaction(transactionId: string, userId: string): Observable<EcotechTransaction | null>;
  /** Cancela la transacción (CANCELADA), salvo que ya esté COMPLETADA. */
  cancelEcotechTransaction(transactionId: string, userId: string): Observable<EcotechTransaction | null>;
}

export const ECODEV_REPOSITORY = new InjectionToken<EcotechRepository>('EcotechRepository');
