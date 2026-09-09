import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-moderator-header',
  imports: [],
  templateUrl: './moderator-header.html',
  styleUrl: './moderator-header.scss',
})
export class ModeratorHeader {
  @Input() badgeText = 'Moderator';
  @Input() badgeClass = 'badge-moderator';
}
