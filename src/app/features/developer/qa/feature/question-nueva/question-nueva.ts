import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ToastService } from '@core/services/toast.service';
import { TagInputComponent } from '@shared/ui/tag-input/tag-input';
import { QuestionStore } from '@features/developer/qa/data-access/state/question.store';
import { CATEGORIAS_QA } from '@features/developer/qa/domain/models/question.model';

interface PreguntaForm {
  titulo: string;
  descripcion: string;
  codigoEjemplo: string;
  categoria: string;
  etiquetas: string[];
}

/** Publicar una pregunta Q&A con etiquetas, categoría y código opcional. */
@Component({
  selector: 'app-question-nueva',
  standalone: true,
  imports: [CommonModule, FormsModule, TagInputComponent],
  templateUrl: './question-nueva.html',
  styleUrl: './question-nueva.scss',
})
export class QuestionNueva implements OnInit {
  private readonly store = inject(QuestionStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly categorias = CATEGORIAS_QA;
  readonly saving = signal(false);
  form: PreguntaForm = QuestionNueva.formVacio();

  ngOnInit(): void {
    if (!localStorage.getItem('userId')) {
      this.toast.error('Inicia sesión para publicar una pregunta');
      this.router.navigate(['/developer/preguntas']);
    }
  }

  submit(): void {
    const autorId = localStorage.getItem('userId');
    if (!autorId) {
      this.toast.error('Inicia sesión para publicar una pregunta');
      return;
    }

    const titulo = this.form.titulo.trim();
    const descripcion = this.form.descripcion.trim();
    if (titulo.length < 10) {
      this.toast.error('El título debe tener al menos 10 caracteres');
      return;
    }
    if (!descripcion) {
      this.toast.error('La descripción es obligatoria');
      return;
    }
    if (!this.form.etiquetas.length) {
      this.toast.error('Indica al menos una etiqueta');
      return;
    }

    this.saving.set(true);
    this.store
      .crearPregunta(autorId, {
        titulo,
        descripcion,
        codigoEjemplo: this.form.codigoEjemplo.trim() || undefined,
        etiquetas: [...this.form.etiquetas],
        categoria: this.form.categoria.trim() || undefined,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (question) => {
          if (!question) {
            this.toast.error('No se pudo publicar la pregunta');
            return;
          }
          this.toast.success('Pregunta publicada');
          this.router.navigate(['/developer/preguntas', question.id]);
        },
        error: (err) => this.toast.error(this.mensajeError(err, 'No se pudo publicar la pregunta')),
      });
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/developer/preguntas']);
    }
  }

  private mensajeError(error: unknown, fallback: string): string {
    const err = error as {
      message?: string;
      graphQLErrors?: Array<{ message?: string }>;
    };
    return err?.graphQLErrors?.[0]?.message ?? err?.message ?? fallback;
  }

  private static formVacio(): PreguntaForm {
    return {
      titulo: '',
      descripcion: '',
      codigoEjemplo: '',
      categoria: '',
      etiquetas: [],
    };
  }
}
