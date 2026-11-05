import { Component, OnInit, effect, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { QuestionStore } from '@features/developer/qa/data-access/state/question.store';
import { QaAuthorStore } from '@features/developer/qa/data-access/state/qa-author.store';
import { QuestionCard } from '@features/developer/qa/ui/question-card/question-card';

/** Preguntas publicadas por el usuario actual. */
@Component({
  selector: 'app-mis-preguntas',
  standalone: true,
  imports: [CommonModule, RouterLink, QuestionCard],
  templateUrl: './mis-preguntas.html',
  styleUrl: './mis-preguntas.scss',
})
export class MisPreguntas implements OnInit {
  readonly store = inject(QuestionStore);
  private readonly authors = inject(QaAuthorStore);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly miUserId = localStorage.getItem('userId') ?? '';
  readonly preguntas = this.store.misPreguntas;
  readonly loading = this.store.misLoading;
  readonly error = this.store.misError;

  constructor() {
    effect(() => {
      this.authors.resolver(this.preguntas().map((question) => question.autorId));
    });
  }

  ngOnInit(): void {
    this.store.loadMisPreguntas(this.miUserId);
  }

  cargarMas(): void {
    this.store.loadMoreMisPreguntas(this.miUserId);
  }

  autorNombre(autorId: string): string {
    return autorId === this.miUserId ? 'Tú' : this.authors.nombre(autorId);
  }

  autorUsuario(autorId: string): string {
    return autorId === this.miUserId ? '' : this.authors.usuario(autorId);
  }

  volver(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/developer/preguntas']);
    }
  }
}
