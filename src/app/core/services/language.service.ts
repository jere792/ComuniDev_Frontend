import { Injectable, signal } from '@angular/core';
import translations from '../../../assets/i18n/es.json';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  lang = signal<'es' | 'en'>('es');
  private translations = translations;

  toggle(): void {
    this.lang.update(v => (v === 'es' ? 'en' : 'es'));
  }

  t(section: string, key: string): string {
    const sectionData = (this.translations as Record<string, Record<string, Record<string, string>>>)[section];
    if (!sectionData) return key;
    const entry = sectionData[key];
    if (!entry) return key;
    return entry[this.lang()] || entry['es'] || key;
  }
}
