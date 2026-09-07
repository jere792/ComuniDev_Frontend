import { Component } from '@angular/core';
import { Hero } from './hero/hero';
import { Enfoque } from './enfoque/enfoque';
import { Techstack } from './techstack/techstack';
import { Feed } from './feed/feed';
import { Cta } from './cta/cta';

@Component({
  selector: 'app-inicio',
  imports: [Hero, Enfoque, Techstack, Feed, Cta],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio {}
