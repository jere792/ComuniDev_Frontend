import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-profile-stats',
  standalone: true,
  templateUrl: './profile-stats.html',
  styleUrl: './profile-stats.scss',
})
export class ProfileStats {
  @Input() followers = 0;
  @Input() following = 0;
  @Input() connections = 0;
}
