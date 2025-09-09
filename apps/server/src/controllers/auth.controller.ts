import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authConfig } from '../config/auth.config';
import { UserModel } from '../models/user.model';
import { RefreshTokenModel } from '../models/refresh-token.model';

const generateAccessToken = (userId: number): string => {
  return jwt.sign(
    { id: userId },
    authConfig.secret as string,
    { expiresIn: authConfig.accessToken.expiresIn } as jwt.SignOptions
  );
};

const generateRefreshToken = (userId: number): string => {
  return jwt.sign(
    { id: userId },
    authConfig.refreshToken.secret as string,
    { expiresIn: authConfig.refreshToken.expiresIn } as jwt.SignOptions
  );
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(Number(user.id));
    const refreshToken = generateRefreshToken(Number(user.id));

    // Calculate refresh token expiry
    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 7); // 7 days from now

    // Save refresh token to database
    await RefreshTokenModel.create(Number(user.id), refreshToken, refreshExpiry);

    res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      accessToken,
      refreshToken
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    console.log('refresh token', req.body)
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token이 제공되지 않았습니다.' });
    }

    // Verify refresh token from database
    const storedToken = await RefreshTokenModel.findByToken(refreshToken);
    if (!storedToken) {
      console.log('Invalid or expired refresh token');
      return res.status(403).json({ message: '유효하지 않거나 만료된 refresh token입니다.' });
    }

    // Verify JWT
    try {
      const decoded = jwt.verify(refreshToken, authConfig.refreshToken.secret as string) as { id: number };
      console.log('Decoded token:', decoded);
      // Generate new access token
      const accessToken = generateAccessToken(decoded.id);
      // Generate new refresh token
      const newRefreshToken = generateRefreshToken(decoded.id);

     // Calculate refresh token expiry
     const refreshExpiry = new Date();
     refreshExpiry.setDate(refreshExpiry.getDate() + 7); // 7 days from now     
      // Save new refresh token to database
      await RefreshTokenModel.create(decoded.id, newRefreshToken, refreshExpiry);

      console.error('new access token:', accessToken);
      res.status(200).json({ accessToken, refreshToken: newRefreshToken });
    } catch (error) {
      console.error('Invalid refresh token:', error);
      await RefreshTokenModel.deleteByToken(refreshToken);
      return res.status(403).json({ message: '유효하지 않은 refresh token입니다.' });
    }
  } catch (err) {
    console.error('Token refresh error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Delete refresh token from database
      await RefreshTokenModel.deleteByToken(refreshToken);
    }

    res.status(200).json({ message: '로그아웃되었습니다.' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};
