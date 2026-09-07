import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-recruiter',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './recruiter.html',
  styleUrl: './recruiter.scss',
})
export class Recruiter {}
