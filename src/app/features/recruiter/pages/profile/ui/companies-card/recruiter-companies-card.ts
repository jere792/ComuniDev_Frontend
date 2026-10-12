import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmpresaRecruiter } from '@core/domain/models/user.model';
import { CompanyNameService } from '@features/recruiter/pages/company/data-access/company-name.service';

@Component({
  selector: 'app-recruiter-companies-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recruiter-companies-card.html',
  styleUrls: ['./recruiter-companies-card.scss'],
})
export class RecruiterCompaniesCard implements OnInit {
  private readonly companyNames = inject(CompanyNameService);

  @Input() empresas: EmpresaRecruiter[] = [];

  ngOnInit(): void {
    this.companyNames.loadAll();
  }

  nombreDe(companyId: string): string {
    return this.companyNames.nameFor(companyId) ?? 'Empresa';
  }

  iniciales(companyId: string): string {
    return this.nombreDe(companyId)
      .split(' ')
      .filter(Boolean)
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
}
