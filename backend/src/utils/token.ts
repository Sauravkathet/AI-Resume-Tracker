import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const signToken = (userId: string): string => {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): { userId: string } | null => {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);

    if (typeof payload === 'object' && payload !== null && 'sub' in payload && payload.sub) {
      return { userId: String(payload.sub) };
    }

    return null;
  } catch {
    return null;
  }
};
