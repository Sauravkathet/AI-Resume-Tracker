import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export const signToken = (userId: string): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign({ sub: userId }, env.JWT_SECRET, options);
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
