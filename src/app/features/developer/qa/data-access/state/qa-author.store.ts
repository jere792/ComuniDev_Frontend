import { Injectable, inject, signal } from '@angular/core';
import { UserStore } from '@features/users/data-access/state/user.store';

export interface QaAuthor {
  id: string;
  nombre: string;
  nombreUsuario: string;
  fotoPerfilUrl: string | null;
}

/**
 * El schema de Q&A solo expone `autorId`, así que los nombres se resuelven
 * aparte y se cachean durante la sesión. Varias pantallas lo comparten.
 */
@Injectable({ providedIn: 'root' })
export class QaAuthorStore {
  private readonly userStore = inject(UserStore);

  readonly autores = signal<Record<string, QaAuthor>>({});
  private readonly pendientes = new Set<string>();

  /** Pide al backend solo los autores que aún no están en caché. */
  resolver(ids: string[]): void {
    const faltantes = [...new Set(ids.filter((id) => !!id))].filter(
      (id) => !this.autores()[id] && !this.pendientes.has(id),
    );
    if (!faltantes.length) return;

    for (const id of faltantes) this.pendientes.add(id);
    this.userStore.getByIds(faltantes).subscribe({
      next: (users) => {
        this.autores.update((actual) => {
          const siguiente = { ...actual };
          for (const user of users) {
            siguiente[user.id] = {
              id: user.id,
              nombre: user.nombre?.trim() || user.nombreUsuario?.trim() || 'Usuario de ComuniDev',
              nombreUsuario: user.nombreUsuario ?? '',
              fotoPerfilUrl: user.fotoPerfilUrl ?? null,
            };
          }
          return siguiente;
        });
        for (const id of faltantes) this.pendientes.delete(id);
      },
      error: () => {
        for (const id of faltantes) this.pendientes.delete(id);
      },
    });
  }

  nombre(autorId: string): string {
    return this.autores()[autorId]?.nombre ?? 'Usuario de ComuniDev';
  }

  usuario(autorId: string): string {
    return this.autores()[autorId]?.nombreUsuario ?? '';
  }

  foto(autorId: string): string | null {
    return this.autores()[autorId]?.fotoPerfilUrl ?? null;
  }
}
