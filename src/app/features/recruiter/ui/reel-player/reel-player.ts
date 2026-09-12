import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-reel-player',
  standalone: true,
  templateUrl: './reel-player.html',
  styleUrl: './reel-player.scss',
})
export class ReelPlayer {
  @Input() video = '';
  @Input() userName = '';
  @Input() userAvatar = '';
  @Input() description = '';
  @Input() likes = 0;
  @Input() comments = 0;
  @Input() liked = false;
  @Input() saved = false;
  @Output() toggleLike = new EventEmitter<void>();
  @Output() toggleSave = new EventEmitter<void>();
}
