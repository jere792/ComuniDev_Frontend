import { Component } from '@angular/core';
import { ContactHero } from '@landing/pages/contact/hero/hero';
import { ContactMessenger } from '@landing/pages/contact/messenger/messenger';

@Component({
  selector: 'app-contact',
  imports: [ContactHero, ContactMessenger],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {}
