import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from './shared/ui/toast/toast';
import { ToastService } from './core/services/toast.service';
import { ImageEditorModal } from './shared/ui/image-editor-modal/image-editor-modal';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast, ImageEditorModal],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('comunidev-frontend');
  private toastService = inject(ToastService);

  protected readonly toast = this.toastService.toast;

  dismissToast(): void {
    this.toastService.dismiss();
  }
}
