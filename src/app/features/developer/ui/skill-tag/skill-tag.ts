import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skill-tag',
  standalone: true,
  templateUrl: './skill-tag.html',
  styleUrl: './skill-tag.scss',
})
export class SkillTag {
  @Input() name = '';
  @Input() level = '';
  @Input() years = 0;
}
