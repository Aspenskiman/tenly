import { Request } from 'express';

export interface AuthPayload {
  userId: string;
  email: string;
  role: 'manager' | 'executive';
  companyId: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}
