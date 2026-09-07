export interface User {
  id: string;
  name: string;
  email: string;
  role: 'developer' | 'recruiter' | 'admin' | 'moderator';
  avatar?: string;
  createdAt: Date;
}
