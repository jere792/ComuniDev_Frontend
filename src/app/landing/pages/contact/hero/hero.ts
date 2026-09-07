import { Component } from '@angular/core';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';
import { ChatPreview } from './chat-preview/chat-preview';
import { TranslationPipe } from '../../../../core/pipes/translation.pipe';

@Component({
  selector: 'app-contact-hero',
  imports: [PageHero, ChatPreview, TranslationPipe],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class ContactHero {}
