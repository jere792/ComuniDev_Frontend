import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { GraphQLService, User } from '../../../core/services/graphql.service';

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './public-profile.html',
  styleUrl: './public-profile.scss',
})
export class PublicProfile implements OnInit {
  user = signal<User | null>(null);
  loading = signal(false);
  errorMessage = signal('');

  constructor(
    private route: ActivatedRoute,
    private graphql: GraphQLService
  ) {}

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('userId');
    if (userId) {
      this.loadUser(userId);
    }
  }

  loadUser(userId: string): void {
    this.loading.set(true);
    this.graphql.getUser(userId).subscribe({
      next: (user: User | null) => {
        this.user.set(user);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error:', err);
        this.errorMessage.set('Usuario no encontrado');
        this.loading.set(false);
      },
    });
  }

  getInitials(): string {
    const name = this.user()?.nombre || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
