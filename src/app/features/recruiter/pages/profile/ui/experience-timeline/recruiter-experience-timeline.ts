import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmpresaRecruiter } from '@core/domain/models/user.model';
import { CompanyNameService } from '@features/recruiter/pages/company/data-access/company-name.service';

@Component({
  selector: 'app-recruiter-experience-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recruiter-experience-timeline.html',
  styleUrl: './recruiter-experience-timeline.scss',
})
export class RecruiterExperienceTimeline implements OnInit {
  private readonly companyNames = inject(CompanyNameService);

  @Input() empresas: EmpresaRecruiter[] = [];

  ngOnInit(): void {
    this.companyNames.loadAll();
  }

  nombreDe(companyId: string): string {
    return this.companyNames.nameFor(companyId) ?? 'Empresa';
  }
}
