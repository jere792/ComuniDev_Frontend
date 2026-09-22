import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from './shared/ui/toast/toast';
import { ToastService } from './core/services/toast.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast],
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
