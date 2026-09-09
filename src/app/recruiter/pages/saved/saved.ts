import { Component } from '@angular/core';

@Component({
  selector: 'app-recruiter-saved',
  templateUrl: './saved.html',
  styleUrl: './saved.scss',
})
export class RecruiterSaved {
  savedItems = [
    {
      id: 1,
      type: 'candidate',
      title: 'Ana Garcia',
      subtitle: 'Frontend Developer',
      avatar: 'https://i.pravatar.cc/150?img=1',
      savedAt: 'Hace 2 días',
    },
    {
      id: 2,
      type: 'reel',
      title: 'Tip de Angular',
      subtitle: 'Por Carlos Lopez',
      thumbnail: 'https://i.pravatar.cc/150?img=3',
      savedAt: 'Hace 5 días',
    },
    {
      id: 3,
      type: 'candidate',
      title: 'Pedro Martinez',
      subtitle: 'DevOps Engineer',
      avatar: 'https://i.pravatar.cc/150?img=7',
      savedAt: 'Hace 1 semana',
    },
  ];

  activeTab: 'all' | 'candidates' | 'reels' = 'all';

  get filteredItems() {
    if (this.activeTab === 'all') return this.savedItems;
    return this.savedItems.filter(item => item.type === this.activeTab);
  }
}
