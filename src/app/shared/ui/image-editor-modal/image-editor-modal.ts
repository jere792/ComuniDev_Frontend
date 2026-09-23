import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ImageEditorService,
} from '../../../core/services/image-editor.service';

interface Adjustments {
  brightness: number;
  contrast: number;
  saturate: number;
  grayscale: number;
  blur: number;
}

const DEFAULT_ADJUST: Adjustments = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  grayscale: 0,
  blur: 0,
};

export const IMAGE_EDITOR_PRESETS: { label: string; value: Adjustments }[] = [
  { label: 'Natural', value: { ...DEFAULT_ADJUST } },
  {
    label: 'Punchy',
    value: { brightness: 105, contrast: 120, saturate: 125, grayscale: 0, blur: 0 },
  },
  {
    label: 'B&N',
    value: { brightness: 100, contrast: 110, saturate: 100, grayscale: 100, blur: 0 },
  },
  {
    label: 'Suave',
    value: { brightness: 105, contrast: 95, saturate: 95, grayscale: 0, blur: 1 },
  },
];

@Component({
  selector: 'app-image-editor-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './image-editor-modal.html',
  styleUrl: './image-editor-modal.scss',
})
export class ImageEditorModal implements AfterViewInit, OnDestroy {
  @ViewChild('stageWrap') stageWrapRef?: ElementRef<HTMLDivElement>;
  @ViewChild('resultCanvas') resultCanvasRef?: ElementRef<HTMLCanvasElement>;

  private service = inject(ImageEditorService);

  state = this.service.editor;
  presets = IMAGE_EDITOR_PRESETS;

  imgNaturalW = signal(0);
  imgNaturalH = signal(0);
  rotation = signal(0);
  flipH = signal(false);
  flipV = signal(false);
  zoom = signal(1);
  cropLeft = signal(0);
  cropTop = signal(0);
  adjust = signal<Adjustments>({ ...DEFAULT_ADJUST });
  showOriginal = signal(false);
  activePreset = signal('Natural');
  activeAspectLabel = signal('');
  exporting = signal(false);
  currentAspect = signal(1);
  stageW = signal(640);
  stageH = signal(420);

  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private img: HTMLImageElement | null = null;
  private loadedUrl: string | null = null;
  private resizeObs: ResizeObserver | null = null;

  readonly zoomPercent = computed(() => Math.round(this.zoom() * 100));

  readonly rotatedDims = computed(() => {
    const r = ((this.rotation() % 360) + 360) % 360;
    if (r === 90 || r === 270) {
      return { w: this.imgNaturalH(), h: this.imgNaturalW() };
    }
    return { w: this.imgNaturalW(), h: this.imgNaturalH() };
  });

  /** Escala para caber la imagen COMPLETA en el stage (contain). */
  readonly fitScale = computed(() => {
    const { w, h } = this.rotatedDims();
    const pad = 16;
    const availW = Math.max(80, this.stageW() - pad * 2);
    const availH = Math.max(80, this.stageH() - pad * 2);
    if (!w || !h) return 1;
    return Math.min(availW / w, availH / h);
  });

  readonly imgDisplayW = computed(() => Math.round(this.rotatedDims().w * this.fitScale()));
  readonly imgDisplayH = computed(() => Math.round(this.rotatedDims().h * this.fitScale()));

  /** Tamaño del recorte en píxeles naturales (zoom agranda/achaica la selección). */
  readonly cropNat = computed(() => {
    const { w: iw, h: ih } = this.rotatedDims();
    const aspect = this.currentAspect() || 1;
    if (!iw || !ih) return { w: 0, h: 0, maxW: 0, maxH: 0 };

    let maxW: number;
    let maxH: number;
    if (iw / ih > aspect) {
      maxH = ih;
      maxW = ih * aspect;
    } else {
      maxW = iw;
      maxH = iw / aspect;
    }
    const z = this.zoom();
    return { w: maxW / z, h: maxH / z, maxW, maxH };
  });

  readonly cropDisplay = computed(() => {
    const c = this.cropNat();
    const s = this.fitScale();
    return { w: Math.max(24, Math.round(c.w * s)), h: Math.max(24, Math.round(c.h * s)) };
  });

  /** Esquina superior-izquierda del recorte en coords de pantalla (relativa al stage). */
  readonly cropDisplayPos = computed(() => {
    const { w: iw, h: ih } = this.rotatedDims();
    const c = this.cropNat();
    const s = this.fitScale();
    const sw = this.stageW();
    const sh = this.stageH();
    const imgLeft = (sw - iw * s) / 2;
    const imgTop = (sh - ih * s) / 2;
    return {
      x: imgLeft + this.cropLeft() * s,
      y: imgTop + this.cropTop() * s,
    };
  });

  readonly previewFilter = computed(() => {
    if (this.showOriginal()) return 'none';
    const a = this.adjust();
    const parts = [
      `brightness(${a.brightness}%)`,
      `contrast(${a.contrast}%)`,
      `saturate(${a.saturate}%)`,
    ];
    if (a.grayscale > 0) parts.push(`grayscale(${a.grayscale}%)`);
    if (a.blur > 0) parts.push(`blur(${a.blur.toFixed(2)}px)`);
    return parts.join(' ');
  });

  /** Preview de recorte en el canvas de resultado. */
  readonly resultSize = computed(() => {
    const c = this.cropNat();
    const maxH = 160;
    const aspect = c.h > 0 ? c.w / c.h : 1;
    let h = maxH;
    let w = h * aspect;
    if (w > 300) {
      w = 300;
      h = w / aspect;
    }
    return { w: Math.max(40, Math.round(w)), h: Math.max(40, Math.round(h)) };
  });

  readonly stageImgTransform = computed(() => {
    const sx = this.flipH() ? -1 : 1;
    const sy = this.flipV() ? -1 : 1;
    return `rotate(${this.rotation()}deg) scale(${sx}, ${sy})`;
  });

  constructor() {
    effect(() => {
      const s = this.state();
      if (s?.previewUrl && s.previewUrl !== this.loadedUrl) {
        this.resetEditor();
        this.currentAspect.set(s.aspect && s.aspect > 0 ? s.aspect : 1);
        if (s.aspectOptions?.length) {
          const free = s.aspectOptions.find((o) => o.value === null);
          this.activeAspectLabel.set(
            s.aspect == null && free ? free.label : (s.aspectLabel ?? s.aspectOptions[0].label),
          );
        } else {
          this.activeAspectLabel.set(s.aspectLabel ?? '');
        }
        this.loadImage(s.previewUrl);
      }
      if (!s) this.releaseImg();
    });

    effect(() => {
      this.cropLeft();
      this.cropTop();
      this.zoom();
      this.rotation();
      this.flipH();
      this.flipV();
      this.adjust();
      this.showOriginal();
      this.stageW();
      this.stageH();
      queueMicrotask(() => this.drawResultPreview());
    });
  }

  ngAfterViewInit(): void {
    this.measureStage();
    const el = this.stageWrapRef?.nativeElement;
    if (el && typeof ResizeObserver !== 'undefined') {
      this.resizeObs = new ResizeObserver(() => this.measureStage());
      this.resizeObs.observe(el);
    }
  }

  ngOnDestroy(): void {
    this.resizeObs?.disconnect();
    this.releaseImg();
  }

  private resetEditor(): void {
    this.rotation.set(0);
    this.flipH.set(false);
    this.flipV.set(false);
    this.zoom.set(1);
    this.adjust.set({ ...DEFAULT_ADJUST });
    this.activePreset.set('Natural');
    this.showOriginal.set(false);
    this.exporting.set(false);
    this.cropLeft.set(0);
    this.cropTop.set(0);
  }

  private loadImage(url: string): void {
    this.releaseImg();
    this.loadedUrl = url;
    const img = new Image();
    img.onload = () => {
      this.img = img;
      this.imgNaturalW.set(img.naturalWidth);
      this.imgNaturalH.set(img.naturalHeight);
      const s = this.state();
      if (s?.aspect && s.aspect > 0) {
        this.currentAspect.set(s.aspect);
      } else {
        this.currentAspect.set(img.naturalWidth / Math.max(1, img.naturalHeight));
      }
      this.measureStage();
      this.centerCrop();
    };
    img.src = url;
  }

  private releaseImg(): void {
    this.img = null;
    this.loadedUrl = null;
  }

  measureStage(): void {
    const el = this.stageWrapRef?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width) this.stageW.set(Math.floor(rect.width));
    if (rect.height) this.stageH.set(Math.floor(rect.height));
    this.clampCrop();
  }

  private centerCrop(): void {
    const { w: iw, h: ih } = this.rotatedDims();
    const c = this.cropNat();
    this.cropLeft.set(Math.max(0, (iw - c.w) / 2));
    this.cropTop.set(Math.max(0, (ih - c.h) / 2));
  }

  private clampCrop(): void {
    const { w: iw, h: ih } = this.rotatedDims();
    const c = this.cropNat();
    const maxL = Math.max(0, iw - c.w);
    const maxT = Math.max(0, ih - c.h);
    const l = Math.min(maxL, Math.max(0, this.cropLeft()));
    const t = Math.min(maxT, Math.max(0, this.cropTop()));
    if (l !== this.cropLeft()) this.cropLeft.set(l);
    if (t !== this.cropTop()) this.cropTop.set(t);
  }

  setAspect(aspect: number | null): void {
    if (aspect == null) {
      const w = this.imgNaturalW();
      const h = this.imgNaturalH();
      const r = ((this.rotation() % 360) + 360) % 360;
      const iw = r === 90 || r === 270 ? h : w;
      const ih = r === 90 || r === 270 ? w : h;
      this.currentAspect.set(iw && ih ? iw / ih : 1);
    } else {
      this.currentAspect.set(aspect);
    }
    this.zoom.set(1);
    this.centerCrop();
    this.clampCrop();
  }

  onAspectChip(opt: { label: string; value: number | null }): void {
    this.setAspect(opt.value);
    this.activeAspectLabel.set(opt.label);
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.08 : 0.08;
    this.setZoom(this.zoom() + delta);
  }

  setZoom(z: number): void {
    const next = Math.min(4, Math.max(1, Math.round(z * 100) / 100));
    const prev = this.zoom();
    if (next === prev) return;
    // Mantener el centro del recorte al hacer zoom
    const { w: iw, h: ih } = this.rotatedDims();
    const c0 = this.cropNat();
    const cx = this.cropLeft() + c0.w / 2;
    const cy = this.cropTop() + c0.h / 2;
    this.zoom.set(next);
    const c1 = this.cropNat();
    this.cropLeft.set(cx - c1.w / 2);
    this.cropTop.set(cy - c1.h / 2);
    this.clampCrop();
    void iw;
    void ih;
  }

  onSliderZoom(value: string | number): void {
    this.setZoom(Number(value) / 100);
  }

  startPan(event: PointerEvent): void {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    this.dragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  onPan(event: PointerEvent): void {
    if (!this.dragging) return;
    const s = this.fitScale();
    if (!s) return;
    const dx = (event.clientX - this.lastX) / s;
    const dy = (event.clientY - this.lastY) / s;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.cropLeft.update((v) => v + dx);
    this.cropTop.update((v) => v + dy);
    this.clampCrop();
  }

  endPan(event: PointerEvent): void {
    this.dragging = false;
    try {
      (event.target as HTMLElement).releasePointerCapture?.(event.pointerId);
    } catch {
      /* noop */
    }
  }

  rotate90(): void {
    const { w: iw, h: ih } = this.rotatedDims();
    const c = this.cropNat();
    // centro del recorte en coords de imagen actual
    const cx = this.cropLeft() + c.w / 2;
    const cy = this.cropTop() + c.h / 2;
    this.rotation.update((r) => (r + 90) % 360);
    // rotar centro 90° horario en el nuevo espacio: (x,y) -> (h-y, x) con h = ih anterior
    this.cropLeft.set(ih - cy - c.w / 2);
    this.cropTop.set(cx - c.h / 2);
    this.clampCrop();
    void iw;
  }

  toggleFlipH(): void {
    const { w: iw } = this.rotatedDims();
    const c = this.cropNat();
    const cx = this.cropLeft() + c.w / 2;
    this.flipH.update((v) => !v);
    this.cropLeft.set(iw - cx - c.w / 2);
    this.clampCrop();
  }

  toggleFlipV(): void {
    const { h: ih } = this.rotatedDims();
    const c = this.cropNat();
    const cy = this.cropTop() + c.h / 2;
    this.flipV.update((v) => !v);
    this.cropTop.set(ih - cy - c.h / 2);
    this.clampCrop();
  }

  updateAdjust(key: keyof Adjustments, value: number | string): void {
    const n = Number(value);
    this.adjust.update((a) => ({ ...a, [key]: n }));
    this.activePreset.set('');
  }

  applyPreset(p: { label: string; value: Adjustments }): void {
    this.adjust.set({ ...p.value });
    this.activePreset.set(p.label);
  }

  resetAll(): void {
    this.resetEditor();
    this.measureStage();
    this.centerCrop();
  }

  showOriginalOn(): void {
    this.showOriginal.set(true);
  }

  showOriginalOff(): void {
    this.showOriginal.set(false);
  }

  cancel(): void {
    this.service.cancel();
  }

  overlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cancel();
  }

  async apply(): Promise<void> {
    if (!this.img || this.exporting()) return;
    this.exporting.set(true);
    try {
      const file = await this.renderToBlob();
      if (file) this.service.confirm(file);
    } finally {
      this.exporting.set(false);
    }
  }

  private async renderToBlob(): Promise<File | null> {
    const img = this.img;
    if (!img) return null;

    const file = await this.renderCropCanvas(0, false);
    return file;
  }

  private drawResultPreview(): void {
    const canvas = this.resultCanvasRef?.nativeElement;
    if (!canvas || !this.img) return;
    const size = this.resultSize();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(size.w * dpr);
    canvas.height = Math.round(size.h * dpr);
    canvas.style.width = `${size.w}px`;
    canvas.style.height = `${size.h}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.paintCrop(ctx, canvas.width, canvas.height, true);
  }

  private buildRotatedCanvas(): HTMLCanvasElement | null {
    const img = this.img;
    if (!img) return null;
    const { w: rw, h: rh } = this.rotatedDims();
    if (!rw || !rh) return null;
    const rotCanvas = document.createElement('canvas');
    rotCanvas.width = rw;
    rotCanvas.height = rh;
    const rctx = rotCanvas.getContext('2d');
    if (!rctx) return null;
    rctx.save();
    rctx.translate(rw / 2, rh / 2);
    rctx.rotate((this.rotation() * Math.PI) / 180);
    rctx.scale(this.flipH() ? -1 : 1, this.flipV() ? -1 : 1);
    rctx.drawImage(img, -this.imgNaturalW() / 2, -this.imgNaturalH() / 2);
    rctx.restore();
    return rotCanvas;
  }

  private cssFilter(a: Adjustments, scaleForBlur: number): string {
    const parts = [
      `brightness(${a.brightness}%)`,
      `contrast(${a.contrast}%)`,
      `saturate(${a.saturate}%)`,
    ];
    if (a.grayscale > 0) parts.push(`grayscale(${a.grayscale}%)`);
    if (a.blur > 0) parts.push(`blur(${(a.blur * scaleForBlur).toFixed(2)}px)`);
    return parts.join(' ');
  }

  private paintCrop(
    ctx: CanvasRenderingContext2D,
    outW: number,
    outH: number,
    preview: boolean,
  ): void {
    const rotCanvas = this.buildRotatedCanvas();
    if (!rotCanvas) return;
    const { w: rw, h: rh } = this.rotatedDims();
    const c = this.cropNat();
    const sx = Math.max(0, Math.min(this.cropLeft(), Math.max(0, rw - c.w)));
    const sy = Math.max(0, Math.min(this.cropTop(), Math.max(0, rh - c.h)));
    const sw = Math.min(c.w, rw);
    const sh = Math.min(c.h, rh);
    if (sw < 1 || sh < 1) return;

    const a = preview && this.showOriginal() ? DEFAULT_ADJUST : this.adjust();
    const blurScale = preview ? 1 : Math.max(1, sw / outW);
    ctx.filter = this.cssFilter(a, blurScale);
    ctx.clearRect(0, 0, outW, outH);
    ctx.drawImage(rotCanvas, sx, sy, sw, sh, 0, 0, outW, outH);
    ctx.filter = 'none';
  }

  private async renderCropCanvas(_margin: number, _useDpr: boolean): Promise<File | null> {
    const rotCanvas = this.buildRotatedCanvas();
    if (!rotCanvas) return null;
    const { w: rw, h: rh } = this.rotatedDims();
    if (!rw || !rh) return null;

    const c = this.cropNat();
    const sx = Math.max(0, Math.min(this.cropLeft(), Math.max(0, rw - c.w)));
    const sy = Math.max(0, Math.min(this.cropTop(), Math.max(0, rh - c.h)));
    const sw = Math.min(c.w, rw);
    const sh = Math.min(c.h, rh);
    if (sw < 1 || sh < 1) return null;

    const a = this.adjust();
    const maxSide = this.state()?.maxSide ?? 1600;
    const outScale = Math.min(1, maxSide / Math.max(sw, sh));
    const outW = Math.max(1, Math.round(sw * outScale));
    const outH = Math.max(1, Math.round(sh * outScale));

    const out = document.createElement('canvas');
    out.width = outW;
    out.height = outH;
    const octx = out.getContext('2d');
    if (!octx) return null;
    this.paintCropTo(octx, rotCanvas, sx, sy, sw, sh, outW, outH);

    const quality = this.state()?.quality ?? 0.85;
    const blob = await new Promise<Blob | null>((resolve) =>
      out.toBlob((b) => resolve(b), 'image/jpeg', quality),
    );
    if (!blob) return null;
    const name = this.state()?.fileName ?? 'imagen.jpg';
    const base = name.replace(/\.[^.]+$/, '');
    return new File([blob], `${base}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
  }

  private paintCropTo(
    octx: CanvasRenderingContext2D,
    rotCanvas: HTMLCanvasElement,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    outW: number,
    outH: number,
  ): void {
    const a = this.adjust();
    const blurScale = Math.max(1, sw / outW);
    octx.filter = this.cssFilter(a, blurScale);
    octx.drawImage(rotCanvas, sx, sy, sw, sh, 0, 0, outW, outH);
    octx.filter = 'none';
  }
}
