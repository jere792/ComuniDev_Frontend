import { Injectable, signal } from '@angular/core';
import { ToastType } from '@shared/ui/toast/toast';

export interface ToastState {
  message: string;
  type: ToastType;
  duration: number;
  id: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private state = signal<ToastState | null>(null);
  private counter = 0;

  readonly toast = this.state.asReadonly();

  show(message: string, type: ToastType = 'success', duration = 3500): void {
    this.state.set({ message, type, duration, id: ++this.counter });
  }

  success(message: string, duration?: number): void {
    this.show(message, 'success', duration);
  }

  info(message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }

  warning(message: string, duration?: number): void {
    this.show(message, 'warning', duration);
  }

  error(message: string, duration?: number): void {
    this.show(message, 'error', duration);
  }

  dismiss(): void {
    this.state.set(null);
  }
}
