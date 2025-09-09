import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth.config';
import * as Multer from 'multer';
import { UserModel } from '../models/user.model';

export interface AuthRequest extends Request {
  files?: Multer.File[];
  userId?: number;
  hospitalId?: number;
}

export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: '토큰이 제공되지 않았습니다.' });
  }

  try {
    const decoded = jwt.verify(token, authConfig.secret as string);
    const userId = (decoded as any).id;
    req.userId = userId;
    req.hospitalId = await UserModel.getHospitalIdByUserId(userId);
    next();
  } catch (err) {
    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
};
