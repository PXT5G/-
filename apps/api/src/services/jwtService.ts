import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';

export interface TokenPayload {
  userId: string;
  username: string;
  role: 'user' | 'admin';
  sessionId: string;
}

export function generateAccessToken(payload: Omit<TokenPayload, 'sessionId'> & { sessionId?: string }): string {
  const sessionId = payload.sessionId ?? uuidv4();
  return jwt.sign(
    { ...payload, sessionId },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
}

export function generateRefreshToken(userId: string, sessionId: string): string {
  return jwt.sign(
    { userId, sessionId, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): { userId: string; sessionId: string } {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as {
    userId: string;
    sessionId: string;
    type: string;
  };
  if (payload.type !== 'refresh') {
    throw new Error('Invalid refresh token');
  }
  return { userId: payload.userId, sessionId: payload.sessionId };
}

export function getRefreshTokenExpiry(): Date {
  const days = parseInt(env.JWT_REFRESH_EXPIRES_IN, 10) || 7;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + (env.JWT_REFRESH_EXPIRES_IN.includes('d') ? days : 7));
  return expiry;
}
