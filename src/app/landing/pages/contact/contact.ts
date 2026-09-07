import { Component } from '@angular/core';
import { ContactHero } from './hero/hero';
import { ContactMessenger } from './messenger/messenger';

@Component({
  selector: 'app-contact',
  imports: [ContactHero, ContactMessenger],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {}
