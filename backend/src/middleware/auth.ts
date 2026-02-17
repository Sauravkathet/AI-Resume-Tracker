import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/token';

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.header('authorization') ?? req.header('Authorization');

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authorization token is required.' });
    return;
  }

  const token = header.replace('Bearer ', '').trim();
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ success: false, message: 'Invalid or expired authorization token.' });
    return;
  }

  req.auth = { userId: payload.userId };
  next();
};
