import { Request, Response } from 'express';
import { db } from '../utils/database';
import { AuthRequest } from 'src/middleware/auth.middleware';
import { ResultSetHeader } from 'mysql2';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/user.model';
import { type User} from '@repo/common'

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

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone, profile, provider, marketingEmail, marketingSms } = req.body;
    // const user = await UserModel.create({ email, password, name, phone, profile, provider, marketingEmail, marketingSms });
    // res.status(201).json(user);
    res.status(201).json({ message: '사용자 생성이 완료되었습니다.' });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};