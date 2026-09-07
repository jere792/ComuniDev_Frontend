import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-moderator',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './moderator.html',
  styleUrl: './moderator.scss',
})
export class Moderator {}
