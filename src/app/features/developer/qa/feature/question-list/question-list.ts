import { Component, OnInit, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { QuestionStore } from '@features/developer/qa/data-access/state/question.store';
import { QaAuthorStore } from '@features/developer/qa/data-access/state/qa-author.store';
import { ESTADOS_PREGUNTA } from '@features/developer/qa/domain/models/question.model';
import { QuestionCard } from '@features/developer/qa/ui/question-card/question-card';

/** Listado público de preguntas Q&A con búsqueda, filtros y "Cargar más". */
@Component({
  selector: 'app-question-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, QuestionCard],
  templateUrl: './question-list.html',
  styleUrl: './question-list.scss',
})
export class QuestionList implements OnInit {
  readonly store = inject(QuestionStore);
  private readonly authors = inject(QaAuthorStore);

  readonly miUserId = localStorage.getItem('userId') ?? '';
  readonly estados = ESTADOS_PREGUNTA;

  busqueda = this.store.q();
  etiqueta = this.store.etiqueta();

  readonly filtrosActivos = computed(
    () => !!(this.store.q() || this.store.categoria() || this.store.etiqueta() || this.store.estado()),
  );

  constructor() {
    effect(() => {
      this.authors.resolver(this.store.questions().map((question) => question.autorId));
    });
  }

  ngOnInit(): void {
    this.store.load();
  }

  buscar(): void {
    this.store.aplicarBusqueda(this.busqueda);
  }

  aplicarEtiqueta(): void {
    this.store.setEtiqueta(this.etiqueta);
  }

  cambiarCategoria(event: Event): void {
    this.store.setCategoria((event.target as HTMLSelectElement).value);
  }

  cambiarEstado(event: Event): void {
    this.store.setEstado((event.target as HTMLSelectElement).value);
  }

  limpiar(): void {
    this.busqueda = '';
    this.etiqueta = '';
    this.store.limpiarFiltros();
  }

  cargarMas(): void {
    this.store.loadMore();
  }

  autorNombre(autorId: string): string {
    return this.authors.nombre(autorId);
  }

  autorUsuario(autorId: string): string {
    return this.authors.usuario(autorId);
  }
}
