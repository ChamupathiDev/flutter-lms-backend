import type { JwtPayload } from 'jsonwebtoken';
import type { UserRole } from '../constants/user.constants';

export interface AuthenticatedUser {
  userId: string;
  sessionId: string;
  email: string;
  role: UserRole;
}

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  sid: string;
  type: 'access';
  role: UserRole;
  tokenVersion: number;
}

export interface RefreshTokenPayload extends JwtPayload {
  sub: string;
  sid: string;
  type: 'refresh';
  tokenVersion: number;
}

export interface PasswordResetTokenPayload extends JwtPayload {
  sub: string;
  type: 'password-reset';
  tokenVersion: number;
}

export interface SessionMetadata {
  ipAddress?: string;
  userAgent?: string;
}