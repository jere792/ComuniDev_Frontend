import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '@core/services/toast.service';
import { UploadService } from '@core/services/upload.service';
import { TagInputComponent } from '@shared/ui/tag-input/tag-input';
import { EcodevStore } from '@features/developer/ecodev/data-access/state/ecodev.store';
import {
  CATEGORIAS_EQUIPO,
  CONDICIONES,
  EcotechPostInput,
} from '@features/developer/ecodev/domain/models/ecodev.model';

interface AnuncioForm {
  tipo: string;
  titulo: string;
  descripcion: string;
  categoriaEquipo: string;
  condicion: string;
  ciudad: string;
  distrito: string;
  lat: number | null;
  lng: number | null;
  etiquetas: string[];
  advertenciaSeguridad: string;
}

/** Publicar un anuncio EcoDev con validación y subida de imágenes a Cloudinary. */
@Component({
  selector: 'app-ecodev-nuevo',
  standalone: true,
  imports: [CommonModule, FormsModule, TagInputComponent],
  templateUrl: './ecodev-nuevo.html',
  styleUrl: './ecodev-nuevo.scss',
})
export class EcodevNuevo implements OnInit {
  private readonly store = inject(EcodevStore);
  private readonly toast = inject(ToastService);
  private readonly upload = inject(UploadService);
  private readonly router = inject(Router);

  /** Base de rutas EcoDev segun el rol activo (/developer o /recruiter). */
  get baseEcoDev(): string {
    return this.router.url.startsWith('/recruiter') ? '/recruiter/ecodev' : '/developer/ecodev';
  }
  private readonly location = inject(Location);

  readonly tipos = Object.entries({
    DONACION: 'Donación',
    INTERCAMBIO: 'Intercambio',
    REPARACION: 'Reparación',
    REUTILIZACION: 'Reutilización',
    RECICLAJE: 'Reciclaje',
    CAMPANA: 'Campaña',
    CONSEJO_GREEN_IT: 'Consejo green IT',
  });
  readonly categorias = Object.entries(CATEGORIAS_EQUIPO);
  readonly condiciones = Object.entries(CONDICIONES);

  readonly saving = signal(false);
  readonly subiendo = signal(false);
  readonly imagenes = signal<string[]>([]);

  form: AnuncioForm = EcodevNuevo.emptyForm();

  ngOnInit(): void {
    if (!localStorage.getItem('userId')) {
      this.toast.error('Inicia sesión para publicar un anuncio');
      this.goBack();
    }
  }

  /**
   * Aviso preventivo: el backend obliga advertencia de seguridad con
   * residuos de riesgo, así que se recuerda antes de enviar.
   */
  get requiereAviso(): boolean {
    return this.form.tipo === 'RECICLAJE' || this.form.condicion === 'NO_FUNCIONAL';
  }

  submit(): void {
    const autorId = localStorage.getItem('userId');
    if (!autorId) {
      this.toast.error('Inicia sesión para publicar un anuncio');
      return;
    }

    const validacion = this.validar();
    if (validacion) {
      this.toast.error(validacion);
      return;
    }

    this.saving.set(true);
    this.store.createPost(autorId, this.buildInput()).subscribe({
      next: (post) => {
        this.saving.set(false);
        if (post) {
          this.toast.success('Anuncio publicado');
          this.router.navigate([this.baseEcoDev]);
        } else {
          this.toast.error('No se pudo publicar el anuncio');
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err?.error?.message ?? 'No se pudo publicar el anuncio');
      },
    });
  }

  // ------------------------------------------------------------ imágenes

  /** Sube cada archivo elegido y agrega su URL al anuncio. */
  onImagenesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) return;

    const pendientes: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        this.toast.error(`"${file.name}" no es una imagen`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.toast.error(`"${file.name}" supera los 5 MB`);
        continue;
      }
      pendientes.push(file);
    }
    input.value = '';
    if (!pendientes.length) return;

    this.subiendo.set(true);
    let restantes = pendientes.length;
    for (const file of pendientes) {
      this.upload.uploadFile(file).subscribe({
        next: (res) => {
          if (res.url) this.imagenes.update((actual) => [...actual, res.url]);
          restantes--;
          if (restantes === 0) {
            this.subiendo.set(false);
            this.toast.success('Imágenes subidas');
          }
        },
        error: () => {
          restantes--;
          if (restantes === 0) this.subiendo.set(false);
          this.toast.error(`No se pudo subir "${file.name}"`);
        },
      });
    }
  }

  quitarImagen(url: string): void {
    this.imagenes.update((actual) => actual.filter((item) => item !== url));
  }

  // -------------------------------------------------------------- helper

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate([this.baseEcoDev]);
    }
  }

  private validar(): string | null {
    if (!this.form.tipo) return 'Elige el tipo de anuncio';
    if (!this.form.titulo.trim()) return 'El anuncio necesita un título';
    if (!this.form.categoriaEquipo) return 'Elige la categoría del equipo';
    if (!this.form.condicion) return 'Elige la condición del equipo';

    const lat = this.form.lat;
    const lng = this.form.lng;
    if (lat != null && (Number.isNaN(lat) || lat < -90 || lat > 90)) {
      return 'La latitud debe estar entre -90 y 90';
    }
    if (lng != null && (Number.isNaN(lng) || lng < -180 || lng > 180)) {
      return 'La longitud debe estar entre -180 y 180';
    }
    if ((lat == null) !== (lng == null)) {
      return 'Indica latitud y longitud juntas, o déjalas ambas vacías';
    }
    return null;
  }

  private buildInput(): EcotechPostInput {
    return {
      tipo: this.form.tipo,
      titulo: this.form.titulo.trim(),
      descripcion: this.form.descripcion.trim() || undefined,
      categoriaEquipo: this.form.categoriaEquipo,
      condicion: this.form.condicion,
      imagenes: this.imagenes().length ? this.imagenes() : undefined,
      ciudad: this.form.ciudad.trim() || undefined,
      distrito: this.form.distrito.trim() || undefined,
      lat: this.form.lat ?? undefined,
      lng: this.form.lng ?? undefined,
      etiquetas: this.form.etiquetas.length ? this.form.etiquetas : undefined,
      advertenciaSeguridad: this.form.advertenciaSeguridad.trim() || undefined,
    };
  }

  private static emptyForm(): AnuncioForm {
    return {
      tipo: '',
      titulo: '',
      descripcion: '',
      categoriaEquipo: '',
      condicion: '',
      ciudad: '',
      distrito: '',
      lat: null,
      lng: null,
      etiquetas: [],
      advertenciaSeguridad: '',
    };
  }
}
