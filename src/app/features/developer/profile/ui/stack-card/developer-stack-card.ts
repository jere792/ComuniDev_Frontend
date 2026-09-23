import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-developer-stack-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './developer-stack-card.html',
  styleUrl: './developer-stack-card.scss',
})
export class DeveloperStackCard {
  @Input() tecnologias: { nombre: string; nivel?: string; aniosExperiencia?: number }[] = [];
  @Input() habilidadesBlandas: string[] = [];
  @Output() editProfile = new EventEmitter<void>();
}
