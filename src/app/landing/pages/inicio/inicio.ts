import { Component } from '@angular/core';
import { Hero } from '@landing/pages/inicio/hero/hero';
import { Enfoque } from '@landing/pages/inicio/enfoque/enfoque';
import { Techstack } from '@landing/pages/inicio/techstack/techstack';
import { Feed } from '@landing/pages/inicio/feed/feed';
import { Cta } from '@landing/pages/inicio/cta/cta';

@Component({
  selector: 'app-inicio',
  imports: [Hero, Enfoque, Techstack, Feed, Cta],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio {}
