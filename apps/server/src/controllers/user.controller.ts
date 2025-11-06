import { Request, Response } from 'express';
import { AuthRequest } from 'src/middleware/auth.middleware';
import { UserModel } from '../models/user.model';
import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth.config';

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

export const checkEmail = async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string;
    const user = await UserModel.checkEmail(email);
    if (user) {
      return res.status(200).json({ valid: false });
    }
    res.status(200).json({ valid: true });
  } catch (err) {
    console.error('Check email error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    const payload = jwt.verify(token, authConfig.resetToken.secret) as { id: number };
    await UserModel.updatePassword(payload.id, password);

    res.status(200).json({ message: '비밀번호가 변경되었습니다.' });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ message: '페이지가 만료되었습니다.\n비밀번호 찾기를 다시 진행해주세요' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { password, newPassword } = req.body;
    console.log(`userId: ${userId}, password: ${password}`);

    const confirmPassword = await UserModel.confirmPassword(userId, password);
    if (!confirmPassword) {
      return res.status(400).json({ message: '현재 비밀번호가 맞지 않습니다. 다시 입력해주세요.' });
    }
    await UserModel.updatePassword(userId, newPassword);

    res.status(200).json({ message: '비밀번호가 변경되었습니다.' });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ message: '페이지가 만료되었습니다.\n비밀번호 찾기를 다시 진행해주세요' });
  }
};