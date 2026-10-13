import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Company } from '@features/recruiter/pages/company/domain/models/company.model';

@Component({
  selector: 'app-recruiter-contact-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recruiter-contact-info.html',
  styleUrl: './recruiter-contact-info.scss',
})
export class RecruiterContactInfo {
  @Input() user: any;
  @Input() profile: any;
  /** Teléfono, sede, RUC y fecha salen de la empresa, no del perfil personal. */
  @Input() empresa: Company | null = null;
  /** Edita estos datos, que viven en Configuración → Empresa. */
  @Output() editEmpresa = new EventEmitter<void>();
}
