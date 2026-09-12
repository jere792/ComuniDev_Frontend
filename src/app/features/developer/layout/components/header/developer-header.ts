import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-developer-header',
  standalone: true,
  templateUrl: './developer-header.html',
  styleUrl: './developer-header.scss',
})
export class DeveloperHeader {
  @Input() badgeText = '';
  @Input() badgeClass = '';
}
