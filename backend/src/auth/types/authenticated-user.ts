import { User } from 'src/entities/user.entity';
import { JwtUser } from './jwt-user';

// Helper function to extract user ID from either JwtUser or User
export function getUserId(user: JwtUser | User): number {
  if ('userId' in user) {
    return user.userId; // JwtUser
  }
  return user.id; // User entity
}

// Helper function to check if user is a full User entity
export function isFullUser(user: JwtUser | User): user is User {
  return 'email' in user;
}

// Type that can be either JwtUser or full User
export type AuthenticatedUser = JwtUser | User;
