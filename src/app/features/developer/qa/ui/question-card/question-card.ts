import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  Question,
  estadoClase,
  estadoLabel,
  extracto,
  iniciales,
} from '@features/developer/qa/domain/models/question.model';

/** Tarjeta del feed de preguntas: estado, extracto, etiquetas, autor y métricas. */
@Component({
  selector: 'app-question-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './question-card.html',
  styleUrl: './question-card.scss',
})
export class QuestionCard {
  @Input({ required: true }) question!: Question;
  /** Nombre resuelto del autor (el schema solo trae autorId). */
  @Input() autorNombre = 'Usuario de ComuniDev';
  @Input() autorUsuario = '';

  estadoLabel = estadoLabel;
  estadoClase = estadoClase;
  extracto = extracto;
  iniciales = iniciales;

  get enlaceDetalle(): string[] {
    return ['/developer/preguntas', this.question.id];
  }

  get esResuelta(): boolean {
    return this.question.estado === 'RESUELTA' || !!this.question.respuestaAceptadaId;
  }
}
