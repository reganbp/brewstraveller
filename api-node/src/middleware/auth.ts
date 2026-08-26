import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'user' | 'admin';
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Authorization header is missing or invalid. Format: Bearer <token>'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'brewstraveller_super_secret_key_123!';
    const payload = jwt.verify(token, secret) as any;

    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role || 'user'
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Authentication token is invalid or has expired.'
    });
  }
}
