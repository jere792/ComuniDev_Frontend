import { Injectable, signal } from '@angular/core';
import { ToastService } from './toast.service';

export interface AspectOption {
  label: string;
  value: number | null;
}

export interface ImageEditorOptions {
  aspect: number | null;
  aspectLabel?: string;
  aspectOptions?: AspectOption[];
  maxSide: number;
  title?: string;
  quality?: number;
}

export interface ImageEditorState extends ImageEditorOptions {
  previewUrl: string;
  fileName: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 15 * 1024 * 1024;

@Injectable({ providedIn: 'root' })
export class ImageEditorService {
  private state = signal<ImageEditorState | null>(null);
  private resolve: ((file: File | null) => void) | null = null;
  private previewUrl: string | null = null;

  readonly editor = this.state.asReadonly();

  constructor(private toast: ToastService) {}

  open(file: File, options: ImageEditorOptions): Promise<File | null> {
    if (!ALLOWED_TYPES.includes(file.type)) {
      this.toast.error('Formato no soportado. Usa JPG, PNG o WebP.');
      return Promise.resolve(null);
    }
    if (file.size > MAX_BYTES) {
      this.toast.error('La imagen supera el máximo de 15 MB.');
      return Promise.resolve(null);
    }

    this.closeInternals(null);

    return new Promise<File | null>((resolve) => {
      this.resolve = resolve;
      this.previewUrl = URL.createObjectURL(file);
      this.state.set({
        ...options,
        previewUrl: this.previewUrl,
        fileName: file.name || 'imagen.jpg',
      });
    });
  }

  confirm(file: File): void {
    this.closeInternals(file);
  }

  cancel(): void {
    this.closeInternals(null);
  }

  private closeInternals(result: File | null): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = null;
    }
    const pending = this.resolve;
    this.resolve = null;
    this.state.set(null);
    pending?.(result);
  }
}
