import { Sentry } from '../instrument';
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
    Sentry.captureException(err);
    res.status(500).json({ message: '사용자 정보를 조회 중 서버 오류가 발생했습니다.' });
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
    Sentry.captureException(err);
    res.status(500).json({ message: '이메일 중복 체크 중 서버 오류가 발생했습니다.' });
  }
};

export const checkPassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { password } = req.body;
    console.log("userId: ", userId);
    console.log("password: ", password);
    const result = await UserModel.confirmPassword(userId, password);
    if (!result) {
      return res.status(400).json({ message: '현재 비밀번호가 맞지 않습니다. 다시 입력해주세요.' });
    }
    res.status(200).json({ message: '비밀번호가 일치합니다.' });
  } catch (err) {
    console.error('Check password error:', err);
    Sentry.captureException(err);
    res.status(500).json({ message: '비밀번호 확인 중 서버 오류가 발생했습니다.' });
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
    Sentry.captureException(err);
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
    Sentry.captureException(err);
    res.status(500).json({ message: '비밀번호 변경 중 서버 오류가 발생했습니다.' });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(400).json({ message: '사용자 정보가 없습니다.' });
    }
    await UserModel.deleteAccount(userId);
    res.status(200).json({ message: '회원 탈퇴가 완료되었습니다.' });
  } catch (err) {
    console.error('Delete user error:', err);
    Sentry.captureException(err);
    res.status(500).json({ message: '회원 탈퇴 중 서버 오류가 발생했습니다.' });
  }
};

export const getAdditionalInfo = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const additionalInfo = await UserModel.getAdditionalInfo(userId);
    res.status(200).json(additionalInfo);
  } catch (err) {
    console.error('Get additional info error:', err);
    Sentry.captureException(err);
    res.status(500).json({ message: '추가 정보 조회 중 서버 오류가 발생했습니다.' });
  }
}

export const insertAdditionalInfo = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { gender, age, interests } = req.body;
    console.log(`gender: ${gender}, age: ${age}, interests: ${interests}`);
    await UserModel.insertAdditionalInfo(userId, gender, age, interests);
    res.status(200).json({ message: '추가 정보가 저장되었습니다.' });
  } catch (err) {
    console.error('Insert additional info error:', err);
    Sentry.captureException(err);
    res.status(500).json({ message: '추가 정보 저장 중 서버 오류가 발생했습니다.' });
  }
};