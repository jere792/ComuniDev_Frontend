import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../services/language.service';

@Pipe({ name: 't', standalone: true, pure: false })
export class TranslationPipe implements PipeTransform {
  private language = inject(LanguageService);

  transform(section: string, key: string): string {
    return this.language.t(section, key);
  }
}
