import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-developer',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './developer.html',
  styleUrl: './developer.scss',
})
export class Developer {}
