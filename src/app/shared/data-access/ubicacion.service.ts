import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';

/** Ruta pública del dataset de ubigeos del Perú (INEI). */
const RUTA_UBIGEO = 'assets/data/ubigeo-peru.json';

/** Fila tal como viene en el JSON: `provincia`/`distrito` en "00" son niveles padre. */
export interface UbigeoFila {
  departamento: string;
  provincia: string;
  distrito: string;
  nombre: string;
}

/** Nivel del ubigeo (departamento, provincia o distrito). */
export interface UbigeoNivel {
  codigo: string;
  nombre: string;
}

export interface UbigeoSeleccion {
  departamento: string;
  provincia: string;
  distrito: string;
}

interface JerarquiaUbigeo {
  departamentos: UbigeoNivel[];
  provinciasPorDepartamento: Map<string, UbigeoNivel[]>;
  /** Clave `${departamento}-${provincia}`. */
  distritosPorProvincia: Map<string, UbigeoNivel[]>;
}

/**
 * Carga una sola vez el ubigeo del Perú y lo expone como una jerarquía
 * Departamento → Provincia → Distrito.
 *
 * Los formularios guardan **nombres** (no códigos), así que las opciones que
 * devuelve este servicio también usan el nombre como valor. Los códigos sirven
 * para resolver los niveles hijos.
 */
@Injectable({ providedIn: 'root' })
export class UbicacionService {
  private readonly http = inject(HttpClient);

  /** `shareReplay` mantiene el JSON y la jerarquía en memoria para toda la app. */
  private readonly jerarquia$: Observable<JerarquiaUbigeo> = this.http
    .get<UbigeoFila[]>(RUTA_UBIGEO)
    .pipe(
      map((filas) => this.construir(filas)),
      catchError(() => of(this.vacia())),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

  departamentos(): Observable<UbigeoNivel[]> {
    return this.jerarquia$.pipe(map((jerarquia) => jerarquia.departamentos));
  }

  provincias(codDepartamento: string): Observable<UbigeoNivel[]> {
    return this.jerarquia$.pipe(
      map((jerarquia) => jerarquia.provinciasPorDepartamento.get(codDepartamento) ?? []),
    );
  }

  distritos(codDepartamento: string, codProvincia: string): Observable<UbigeoNivel[]> {
    return this.jerarquia$.pipe(
      map(
        (jerarquia) =>
          jerarquia.distritosPorProvincia.get(`${codDepartamento}-${codProvincia}`) ?? [],
      ),
    );
  }

  /**
   * Devuelve los nombres de los tres niveles a partir de sus códigos. Útil
   * cuando el formulario guarda códigos y la API espera nombres (o al revés).
   */
  buscarNombres(
    codDepartamento: string,
    codProvincia: string,
    codDistrito: string,
  ): Observable<UbigeoSeleccion> {
    return this.jerarquia$.pipe(
      map((jerarquia) => {
        const departamento = jerarquia.departamentos.find(
          (item) => item.codigo === codDepartamento,
        );
        const provincia = jerarquia.provinciasPorDepartamento
          .get(codDepartamento)
          ?.find((item) => item.codigo === codProvincia);
        const distrito = jerarquia.distritosPorProvincia
          .get(`${codDepartamento}-${codProvincia}`)
          ?.find((item) => item.codigo === codDistrito);

        return {
          departamento: departamento?.nombre ?? '',
          provincia: provincia?.nombre ?? '',
          distrito: distrito?.nombre ?? '',
        };
      }),
    );
  }

  /**
   * Intenta reconstruir departamento/provincia/distrito desde los nombres que
   * ya tenga guardados un perfil. Sirve para precargar los selects cuando el
   * dato viejo venía de campos de texto libre (por ejemplo, solo ciudad).
   *
   * Solo completa niveles vacíos: nunca reemplaza un valor existente.
   */
  resolverPorNombres(partes: {
    departamento?: string | null;
    provincia?: string | null;
    ciudad?: string | null;
    distrito?: string | null;
  }): Observable<UbigeoSeleccion | null> {
    const buscado = {
      departamento: normalizar(partes.departamento),
      provincia: normalizar(partes.provincia || partes.ciudad),
      distrito: normalizar(partes.distrito),
    };

    return this.jerarquia$.pipe(
      map((jerarquia) => {
        let departamento: UbigeoNivel | undefined;

        if (buscado.departamento) {
          departamento = jerarquia.departamentos.find((item) =>
            coincide(item.nombre, buscado.departamento),
          );
          // Un departamento guardado que no existe en el dataset no debe
          // reinterpretarse como otro: se conserva tal cual en el formulario.
          if (!departamento) return null;
        }

        if (!departamento && buscado.provincia) {
          for (const [codigo, provincias] of jerarquia.provinciasPorDepartamento) {
            if (provincias.some((item) => coincide(item.nombre, buscado.provincia))) {
              departamento = jerarquia.departamentos.find((item) => item.codigo === codigo);
              break;
            }
          }
        }

        if (!departamento && buscado.distrito) {
          for (const [clave, distritos] of jerarquia.distritosPorProvincia) {
            if (distritos.some((item) => coincide(item.nombre, buscado.distrito))) {
              const codigo = clave.split('-')[0];
              departamento = jerarquia.departamentos.find((item) => item.codigo === codigo);
              break;
            }
          }
        }

        if (!departamento) return null;

        const provincias =
          jerarquia.provinciasPorDepartamento.get(departamento.codigo) ?? [];

        let provincia = buscado.provincia
          ? provincias.find((item) => coincide(item.nombre, buscado.provincia))
          : undefined;

        if (!provincia && buscado.distrito) {
          provincia = provincias.find((item) =>
            (jerarquia.distritosPorProvincia.get(
              `${departamento?.codigo}-${item.codigo}`,
            ) ?? []).some((distrito) => coincide(distrito.nombre, buscado.distrito)),
          );
        }

        if (!provincia) return null;

        const distritos =
          jerarquia.distritosPorProvincia.get(
            `${departamento.codigo}-${provincia.codigo}`,
          ) ?? [];
        const distrito = buscado.distrito
          ? distritos.find((item) => coincide(item.nombre, buscado.distrito))
          : undefined;

        return {
          departamento: departamento.nombre,
          provincia: provincia.nombre,
          distrito: distrito?.nombre ?? '',
        };
      }),
    );
  }

  /**
   * Arma la jerarquía a partir del JSON plano.
   *
   * El dataset trae una fila de nivel departamento duplicada/genérica (Bagua
   * con código 01), así que se conserva la primera aparición de cada código.
   */
  private construir(filas: UbigeoFila[]): JerarquiaUbigeo {
    const departamentos: UbigeoNivel[] = [];
    const provinciasPorDepartamento = new Map<string, UbigeoNivel[]>();
    const distritosPorProvincia = new Map<string, UbigeoNivel[]>();
    const departamentosVistos = new Set<string>();
    const provinciasVistas = new Set<string>();

    for (const fila of filas) {
      const nombre = (fila.nombre ?? '').trim();
      if (!nombre) continue;

      if (fila.provincia === '00' && fila.distrito === '00') {
        if (departamentosVistos.has(fila.departamento)) continue;
        departamentosVistos.add(fila.departamento);
        departamentos.push({ codigo: fila.departamento, nombre });
        continue;
      }

      if (fila.distrito === '00') {
        const claveProvincia = `${fila.departamento}-${fila.provincia}`;
        if (provinciasVistas.has(claveProvincia)) continue;
        provinciasVistas.add(claveProvincia);

        const provincias = provinciasPorDepartamento.get(fila.departamento) ?? [];
        provincias.push({ codigo: fila.provincia, nombre });
        provinciasPorDepartamento.set(fila.departamento, provincias);
        continue;
      }

      const claveDistrito = `${fila.departamento}-${fila.provincia}`;
      const distritos = distritosPorProvincia.get(claveDistrito) ?? [];
      distritos.push({ codigo: fila.distrito, nombre });
      distritosPorProvincia.set(claveDistrito, distritos);
    }

    ordenar(departamentos);
    provinciasPorDepartamento.forEach(ordenar);
    distritosPorProvincia.forEach(ordenar);

    return { departamentos, provinciasPorDepartamento, distritosPorProvincia };
  }

  private vacia(): JerarquiaUbigeo {
    return {
      departamentos: [],
      provinciasPorDepartamento: new Map(),
      distritosPorProvincia: new Map(),
    };
  }
}

function ordenar(niveles: UbigeoNivel[]): void {
  niveles.sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }),
  );
}

/** Compara nombres ignorando tildes, mayúsculas y espacios extra. */
function normalizar(valor: string | null | undefined): string {
  return (valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function coincide(nombre: string, buscado: string): boolean {
  return normalizar(nombre) === buscado;
}
