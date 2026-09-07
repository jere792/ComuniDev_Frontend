import { Component } from '@angular/core';
import { Hero } from './hero/hero';
import { Feed } from './feed/feed';

@Component({
  selector: 'app-inicio',
  imports: [Hero, Feed],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio {}
