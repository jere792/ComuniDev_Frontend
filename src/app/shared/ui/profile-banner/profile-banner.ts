import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-profile-banner',
  standalone: true,
  templateUrl: './profile-banner.html',
  styleUrl: './profile-banner.scss',
})
export class ProfileBanner {
  @Input() initials = '';
}
