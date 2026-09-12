import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search',
  imports: [FormsModule],
  templateUrl: './search.html',
  styleUrl: './search.scss',
})
export class SearchComponent {
  searchTerm = '';
  recentSearches = ['Angular Developer', 'React', 'Node.js'];

  search(): void {
    if (this.searchTerm.trim()) {
      console.log('Buscando:', this.searchTerm);
    }
  }

  clearRecent(): void {
    this.recentSearches = [];
  }
}
