import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { Subject, debounceTime, firstValueFrom, takeUntil } from 'rxjs';
import { PERU_NOMBRE } from '@shared/constants/peru-departments';
import {
  UbicacionService,
  UbigeoNivel,
} from '@shared/data-access/ubicacion.service';

/** Nombres de los controles del formulario que consume el selector. */
export interface UbicacionCampos {
  pais: string;
  departamento: string;
  provincia: string;
  ciudad: string;
  distrito: string;
}

const CAMPOS_POR_DEFECTO: UbicacionCampos = {
  pais: 'pais',
  departamento: 'departamento',
  provincia: 'provincia',
  ciudad: 'ciudad',
  distrito: 'distrito',
};

/**
 * Selector dependiente Departamento → Provincia → Distrito para el ubigeo del
 * Perú.
 *
 * Se usa dentro de un formulario reactivo y mantiene los `formControlName` del
 * formulario que lo contiene, así que el submit no cambia. Recibe el
 * `FormGroup` por `[formGroup]`; los nombres por defecto son `pais`,
 * `departamento`, `provincia`, `ciudad` y `distrito`, y se pueden cambiar con
 * `[campos]`.
 *
 * `ciudad` se completa con el nombre de la provincia (equivale a la ciudad
 * capital) para no perder ese dato en pantallas que todavía lo muestran.
 */
@Component({
  selector: 'app-ubicacion-selector',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './ubicacion-selector.html',
  styleUrl: './ubicacion-selector.scss',
})
export class UbicacionSelectorComponent implements OnInit, OnDestroy {
  private readonly ubicacion = inject(UbicacionService);
  private readonly destruir$ = new Subject<void>();
  private static secuencia = 0;

  /** Formulario que contiene los controles de ubicación. */
  @Input({ required: true }) formGroup!: FormGroup;
  @Input() campos: UbicacionCampos = CAMPOS_POR_DEFECTO;
  /** El país solo se muestra cuando la pantalla no tiene ya su propio select. */
  @Input() mostrarPais = true;

  readonly id = `ubicacion-${UbicacionSelectorComponent.secuencia++}`;
  readonly paises = signal<string[]>([PERU_NOMBRE]);
  readonly departamentos = signal<UbigeoNivel[]>([]);
  readonly provincias = signal<UbigeoNivel[]>([]);
  readonly distritos = signal<UbigeoNivel[]>([]);
  readonly cargando = signal(true);

  private codigoDepartamento = '';
  private codigoProvincia = '';
  private versionCarga = 0;
  /** Evita que las limpiezas de la precarga disparen los cambios en cascada. */
  private restaurando = false;
  /** Firma de los valores ya precargados; ignora el primer eco de valueChanges. */
  private firmaRestaurada = '';

  ngOnInit(): void {
    this.escucharCambios();

    this.ubicacion
      .departamentos()
      .pipe(takeUntil(this.destruir$))
      .subscribe((departamentos) => {
        this.departamentos.set(departamentos);
        this.cargando.set(false);
        void this.restaurar();
      });
  }

  ngOnDestroy(): void {
    this.destruir$.next();
    this.destruir$.complete();
  }

  private get formulario(): FormGroup | null {
    return this.formGroup ?? null;
  }

  private control(campo: keyof UbicacionCampos): AbstractControl | null {
    return this.formulario?.get(this.campos[campo]) ?? null;
  }

  private valor(campo: keyof UbicacionCampos): string {
    const valor = this.control(campo)?.value;
    return typeof valor === 'string' ? valor.trim() : '';
  }

  private firmaActual(): string {
    return [
      this.valor('departamento'),
      this.valor('provincia'),
      this.valor('distrito'),
      this.valor('ciudad'),
    ].join('|');
  }

  private escucharCambios(): void {
    this.control('pais')
      ?.valueChanges.pipe(takeUntil(this.destruir$))
      .subscribe(() => this.sincronizarPais());

    // `debounceTime(0)` deja que un `patchValue` con varios campos termine
    // antes de recalcular la cascada; si no, cada nivel se limpiaría a mitad
    // de la precarga.
    this.control('departamento')
      ?.valueChanges.pipe(debounceTime(0), takeUntil(this.destruir$))
      .subscribe(() => void this.cambiarDepartamento());

    this.control('provincia')
      ?.valueChanges.pipe(debounceTime(0), takeUntil(this.destruir$))
      .subscribe(() => void this.cambiarProvincia());
  }

  /** Precarga los selects con lo que ya tenga guardado el formulario. */
  private async restaurar(): Promise<void> {
    const version = ++this.versionCarga;
    this.restaurando = true;

    try {
      this.sincronizarPais();
      await this.completarNivelesFaltantes();
      if (version !== this.versionCarga) return;
      await this.cargarDesdeFormulario(version, false);
    } finally {
      if (version === this.versionCarga) {
        this.firmaRestaurada = this.firmaActual();
        this.restaurando = false;
      }
    }
  }

  /**
   * Los datos viejos podían tener solo ciudad/distrito. Si falta departamento
   * o provincia se intenta deducirlos de los nombres guardados.
   */
  private async completarNivelesFaltantes(): Promise<void> {
    const departamento = this.valor('departamento');
    const provincia = this.valor('provincia');

    if (departamento && provincia) return;

    const resuelto = await firstValueFrom(
      this.ubicacion.resolverPorNombres({
        departamento,
        provincia,
        ciudad: this.valor('ciudad'),
        distrito: this.valor('distrito'),
      }),
    );
    if (!resuelto) return;

    this.escribirSiVacio('departamento', resuelto.departamento);
    this.escribirSiVacio('provincia', resuelto.provincia);
    this.escribirSiVacio('distrito', resuelto.distrito);
  }

  private escribirSiVacio(campo: keyof UbicacionCampos, valor: string): void {
    if (!valor || this.valor(campo)) return;
    this.control(campo)?.setValue(valor);
  }

  /** Recalcula las opciones hijas leyendo los valores actuales del formulario. */
  private async cargarDesdeFormulario(version: number, limpiar: boolean): Promise<void> {
    const nombreDepartamento = this.valor('departamento');
    const departamento = nombreDepartamento
      ? this.departamentos().find((item) => coincide(item.nombre, nombreDepartamento))
      : undefined;
    this.codigoDepartamento = departamento?.codigo ?? '';
    this.codigoProvincia = '';

    if (!departamento) {
      this.provincias.set(this.opcionesConValor(this.valor('provincia')));
      this.distritos.set(this.opcionesConValor(this.valor('distrito')));
      return;
    }

    const provincias = await firstValueFrom(this.ubicacion.provincias(departamento.codigo));
    if (version !== this.versionCarga) return;

    this.provincias.set(this.conLegado(provincias, this.valor('provincia')));

    const nombreProvincia = this.valor('provincia');
    const provincia = nombreProvincia
      ? this.provincias().find((item) => coincide(item.nombre, nombreProvincia))
      : undefined;
    this.codigoProvincia = provincia?.codigo ?? '';

    if (!provincia?.codigo) {
      this.distritos.set(this.opcionesConValor(this.valor('distrito')));
      return;
    }

    await this.cargarDistritos(version, provincia, limpiar);
  }

  private async cambiarDepartamento(): Promise<void> {
    if (this.restaurando || this.firmaActual() === this.firmaRestaurada) return;

    const version = ++this.versionCarga;
    const nombre = this.valor('departamento');
    const departamento = nombre
      ? this.departamentos().find((item) => coincide(item.nombre, nombre))
      : undefined;
    this.codigoDepartamento = departamento?.codigo ?? '';
    this.codigoProvincia = '';

    if (!departamento) {
      this.limpiarDesdeProvincia();
      this.provincias.set(this.opcionesConValor(this.valor('provincia')));
      this.distritos.set(this.opcionesConValor(this.valor('distrito')));
      return;
    }

    const provincias = await firstValueFrom(this.ubicacion.provincias(departamento.codigo));
    if (version !== this.versionCarga) return;

    const nombreProvincia = this.valor('provincia');
    const provincia = nombreProvincia
      ? provincias.find((item) => coincide(item.nombre, nombreProvincia))
      : undefined;

    // La provincia anterior no pertenece al departamento nuevo: se limpia.
    if (!provincia) this.limpiarDesdeProvincia();

    this.provincias.set(this.conLegado(provincias, this.valor('provincia')));

    if (!provincia) {
      this.distritos.set(this.opcionesConValor(this.valor('distrito')));
      return;
    }

    await this.cargarDistritos(version, provincia, true);
  }

  private async cambiarProvincia(): Promise<void> {
    if (this.restaurando || this.firmaActual() === this.firmaRestaurada) return;

    const version = ++this.versionCarga;
    const nombre = this.valor('provincia');
    const provincia = nombre
      ? this.provincias().find((item) => coincide(item.nombre, nombre))
      : undefined;

    if (!provincia?.codigo) {
      this.codigoProvincia = '';
      this.limpiarDesdeDistrito();
      this.distritos.set(this.opcionesConValor(this.valor('distrito')));
      return;
    }

    this.codigoProvincia = provincia.codigo;
    await this.cargarDistritos(version, provincia, true);
  }

  private async cargarDistritos(
    version: number,
    provincia: UbigeoNivel,
    limpiar: boolean,
  ): Promise<void> {
    if (!this.codigoDepartamento) {
      this.distritos.set([]);
      return;
    }

    const distritos = await firstValueFrom(
      this.ubicacion.distritos(this.codigoDepartamento, provincia.codigo),
    );
    if (version !== this.versionCarga) return;

    const nombreDistrito = this.valor('distrito');
    const existe =
      !!nombreDistrito && distritos.some((item) => coincide(item.nombre, nombreDistrito));
    if (limpiar && nombreDistrito && !existe) {
      this.control('distrito')?.setValue('');
    }

    this.distritos.set(this.conLegado(distritos, this.valor('distrito')));
    this.completarCiudad(provincia.nombre, limpiar);
  }

  /** La ciudad equivale a la capital de la provincia; se conserva si ya existe. */
  private completarCiudad(nombreProvincia: string, reemplazar = false): void {
    if (!nombreProvincia) return;
    if (!reemplazar && this.valor('ciudad')) return;
    this.control('ciudad')?.setValue(nombreProvincia);
  }

  private limpiarDesdeProvincia(): void {
    this.control('provincia')?.setValue('');
    this.control('ciudad')?.setValue('');
    this.codigoProvincia = '';
    this.limpiarDesdeDistrito();
  }

  private limpiarDesdeDistrito(): void {
    this.control('distrito')?.setValue('');
    this.distritos.set([]);
  }

  private sincronizarPais(): void {
    const pais = this.valor('pais');
    if (pais && !this.paises().some((item) => coincide(item, pais))) {
      this.paises.set([...this.paises(), pais]);
    }
  }

  /** Agrega el valor guardado si no está en el dataset, para no perderlo. */
  private conLegado(opciones: UbigeoNivel[], valor: string): UbigeoNivel[] {
    const nombre = valor.trim();
    if (!nombre) return opciones;
    if (opciones.some((item) => coincide(item.nombre, nombre))) return opciones;
    return [...opciones, { codigo: '', nombre }];
  }

  private opcionesConValor(valor: string): UbigeoNivel[] {
    const nombre = valor.trim();
    return nombre ? [{ codigo: '', nombre }] : [];
  }
}

function normalizar(valor: string | null | undefined): string {
  return (valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function coincide(nombre: string, buscado: string): boolean {
  return normalizar(nombre) === normalizar(buscado);
}
