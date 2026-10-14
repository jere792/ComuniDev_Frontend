import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Entrada de lista por etiquetas, en lugar del campo de texto "separado por
 * coma". Cada valor se agrega con Enter o con la coma, y se borra con la ×.
 *
 * Guarda y devuelve un `string[]`, y funciona igual con `ngModel` que con
 * `formControlName`.
 */
@Component({
  selector: 'app-tag-input',
  standalone: true,
  templateUrl: './tag-input.html',
  styleUrl: './tag-input.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TagInputComponent),
      multi: true,
    },
  ],
})
export class TagInputComponent implements ControlValueAccessor {
  @Input() titulo = '';
  @Input() placeholder = '';
  /** Ayuda bajo el campo, por ejemplo "Pulsa Enter para agregar". */
  @Input() ayuda = '';
  /** Límite de etiquetas. 0 o menos significa sin límite. */
  @Input() limite = 0;

  etiquetas: string[] = [];
  borrador = '';
  desactivado = false;

  private onChange: (valor: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  get lleno(): boolean {
    return this.limite > 0 && this.etiquetas.length >= this.limite;
  }

  /** Avisa al formulario que el campo ya fue tocado, para los errores. */
  marcarTocado(): void {
    this.onTouched();
  }

  agregarEnTecla(evento: KeyboardEvent): void {
    if (evento.key !== 'Enter' && evento.key !== ',') return;
    evento.preventDefault();
    this.agregar();
  }

  /** Al salir del campo suelta lo que quedó escrito, como el campo viejo. */
  agregarAlSalir(): void {
    this.agregar();
  }

  agregar(): void {
    // La coma final no debe aparecer como etiqueta vacía.
    const valor = this.borrador.trim().replace(/,+$/, '').trim();
    this.borrador = '';

    if (!valor || this.lleno) return;
    // Sin repetir: "Java" dos veces es el mismo requisito.
    if (this.etiquetas.includes(valor)) return;

    this.etiquetas = [...this.etiquetas, valor];
    this.onChange(this.etiquetas);
  }

  quitar(valor: string): void {
    this.etiquetas = this.etiquetas.filter(item => item !== valor);
    this.onChange(this.etiquetas);
  }

  // ------------------------------------------------- ControlValueAccessor

  writeValue(valor: string[] | null | undefined): void {
    this.etiquetas = Array.isArray(valor) ? [...valor] : [];
  }

  registerOnChange(fn: (valor: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(desactivado: boolean): void {
    this.desactivado = desactivado;
  }
}
