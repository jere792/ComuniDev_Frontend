import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface HeaderLink {
  label: string;
  route: string;
  icon?: string;
}

@Component({
  selector: 'app-recruiter-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './recruiter-header.html',
  styleUrl: './recruiter-header.scss',
})
export class RecruiterHeader {
  @Input() links: HeaderLink[] = [];
}
