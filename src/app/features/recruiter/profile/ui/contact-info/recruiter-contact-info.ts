import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  @Output() editBasic = new EventEmitter<void>();
  @Output() editProfile = new EventEmitter<void>();
}
