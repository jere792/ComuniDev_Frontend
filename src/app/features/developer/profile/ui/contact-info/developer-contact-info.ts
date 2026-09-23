import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-developer-contact-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './developer-contact-info.html',
  styleUrl: './developer-contact-info.scss',
})
export class DeveloperContactInfo {
  @Input() user: any;
  @Input() profile: any;
  @Output() editBasic = new EventEmitter<void>();
  @Output() editProfile = new EventEmitter<void>();
}
