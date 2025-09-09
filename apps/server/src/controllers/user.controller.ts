import { Request, Response } from 'express';
import { db } from '../utils/database';
import { AuthRequest } from 'src/middleware/auth.middleware';
import { ResultSetHeader } from 'mysql2';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/user.model';


export const getUserInfo = async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserModel.userInfoById(req.userId);
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error('Get user info error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};