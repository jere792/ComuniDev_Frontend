import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class Toast implements OnChanges {
  @Input() message = '';
  @Input() type: ToastType = 'success';
  @Input() duration = 3500;
  @Input() visible = true;
  @Output() dismiss = new EventEmitter<void>();

  private timer: ReturnType<typeof setTimeout> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] || changes['duration'] || changes['type']) {
      this.clearTimer();
      if (this.visible && this.duration > 0) {
        this.timer = setTimeout(() => this.dismiss.emit(), this.duration);
      }
    }
  }

  get icon(): string {
    switch (this.type) {
      case 'success': return 'check_circle';
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'notifications';
    }
  }

  onClose(): void {
    this.clearTimer();
    this.dismiss.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
