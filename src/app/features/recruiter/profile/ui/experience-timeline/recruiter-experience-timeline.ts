import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recruiter-experience-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recruiter-experience-timeline.html',
  styleUrl: './recruiter-experience-timeline.scss',
})
export class RecruiterExperienceTimeline {
  @Input() empresas: any[] = [];
}
