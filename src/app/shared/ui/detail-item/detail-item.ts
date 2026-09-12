import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-detail-item',
  standalone: true,
  templateUrl: './detail-item.html',
  styleUrl: './detail-item.scss',
})
export class DetailItem {
  @Input() label = '';
  @Input() value = '';
}
