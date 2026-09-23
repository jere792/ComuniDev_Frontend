import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recruiter-companies-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recruiter-companies-card.html',
  styleUrls: ['./recruiter-companies-card.scss'],
})
export class RecruiterCompaniesCard {
  @Input() empresas: any[] = [];
}
