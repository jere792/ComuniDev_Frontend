import { Component } from '@angular/core';

@Component({
  selector: 'app-recruiter-reels',
  templateUrl: './reels.html',
  styleUrl: './reels.scss',
})
export class RecruiterReels {
  reels = [
    {
      id: 1,
      user: { name: 'Ana Garcia', avatar: 'https://i.pravatar.cc/150?img=1' },
      video: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      description: 'Proyecto nuevo en React #developer #frontend',
      likes: 234,
      comments: 45,
      saved: false,
      liked: false,
    },
    {
      id: 2,
      user: { name: 'Carlos Lopez', avatar: 'https://i.pravatar.cc/150?img=3' },
      video: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      description: 'Tip de Angular #angular #typescript',
      likes: 189,
      comments: 32,
      saved: true,
      liked: false,
    },
    {
      id: 3,
      user: { name: 'Maria Rodriguez', avatar: 'https://i.pravatar.cc/150?img=5' },
      video: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      description: 'Mi setup de desarrollo #devlife',
      likes: 456,
      comments: 78,
      saved: false,
      liked: false,
    },
  ];

  currentIndex = 0;

  nextReel(): void {
    if (this.currentIndex < this.reels.length - 1) {
      this.currentIndex++;
    }
  }

  prevReel(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  toggleLike(reel: any): void {
    reel.liked = !reel.liked;
    reel.likes += reel.liked ? 1 : -1;
  }

  toggleSave(reel: any): void {
    reel.saved = !reel.saved;
  }
}
