import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authConfig } from '../config/auth.config';
import { UserModel } from '../models/user.model';
import { RefreshTokenModel } from '../models/refresh-token.model';
import axios from 'axios';

const generateAccessToken = (userId: number, auto: boolean): string => {
  console.log(`userId: ${userId}, auto: ${auto}`);
  const expiresIn = auto ? authConfig.expires.auto.accessToken : authConfig.expires.normal.accessToken;
  return jwt.sign(
    { id: userId },
    authConfig.secret as string,
    { expiresIn } as jwt.SignOptions
  );
};

const generateRefreshToken = (userId: number, auto: boolean): string => {
  const expiresIn = auto ? authConfig.expires.auto.refreshToken : authConfig.expires.normal.refreshToken;
  return jwt.sign(
    { id: userId },
    authConfig.refreshToken.secret as string,
    { expiresIn } as jwt.SignOptions
  );
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, keepLoggedIn } = req.body;

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(Number(user.id), keepLoggedIn); 
    const refreshToken = generateRefreshToken(Number(user.id), keepLoggedIn);

    // Calculate refresh token expiry
    const refreshExpiry = new Date();
    // refreshExpiry.setDate(refreshExpiry.getDate() + 7); // 7 days from now
    if (keepLoggedIn) {
      refreshExpiry.setDate(refreshExpiry.getDate() + 14); // 14일
    } else {
      refreshExpiry.setHours(refreshExpiry.getHours() + 1); // 1시간
    }

    // Save refresh token to database
    await RefreshTokenModel.create(Number(user.id), refreshToken, refreshExpiry);

    // RefreshToken을 HttpOnly 쿠키에 저장
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: keepLoggedIn 
        ? 14 * 24 * 60 * 60 * 1000 // 14일
        : 1 * 60 * 60 * 1000,       // 1시간
    });

    res.status(200).json({
      id: user.id,
      // email: user.email,
      // name: user.name,
      // phone: user.phone,
      // profile: user.profile,
      accessToken,
      // refreshToken
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    console.log('refresh token', req.cookies.refreshToken)
    const refreshToken = req.cookies.refreshToken;
    const { keepLoggedIn } = req.body;

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
      const newAccessToken = generateAccessToken(decoded.id, keepLoggedIn);
      // Generate new refresh token
      const newRefreshToken = generateRefreshToken(decoded.id, keepLoggedIn);

      // Calculate refresh token expiry
      const refreshExpiry = new Date();
      //  refreshExpiry.setDate(refreshExpiry.getDate() + 7); // 7 days from now 
      if (keepLoggedIn) {
        refreshExpiry.setDate(refreshExpiry.getDate() + 14); // 14일
      } else {
        refreshExpiry.setHours(refreshExpiry.getHours() + 1); // 1시간
      }
      // Save new refresh token to database
      await RefreshTokenModel.create(decoded.id, newRefreshToken, refreshExpiry);

      console.error('new access token:', newAccessToken);
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: keepLoggedIn 
          ? 14 * 24 * 60 * 60 * 1000 // 14일
          : 1 * 60 * 60 * 1000,       // 1시간
          // : 1 * 60 * 1000,
      });
      res.status(200).json({ accessToken: newAccessToken });
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
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Delete refresh token from database
      await RefreshTokenModel.deleteByToken(refreshToken);
    }
    res.clearCookie('refreshToken', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({ message: '로그아웃되었습니다.' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const formatPhoneNumber = (phone: string | null) => {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("82")) {
    digits = "0" + digits.slice(2);
  }
  return digits;
};

const handleKakao = async (code: string) => {
  console.log("KAKAO_REST_API_KEY:", process.env.KAKAO_REST_API_KEY);
  console.log("KAKAO_REDIRECT_URI:", process.env.KAKAO_REDIRECT_URI);
  const tokenRes = await axios.post(
    "https://kauth.kakao.com/oauth/token",
    null,
    {
      params: {
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_REST_API_KEY,
        redirect_uri: process.env.KAKAO_REDIRECT_URI,
        code,
      },
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    }
  );

  const access_token = tokenRes.data.access_token;
  console.log('access_token:', access_token);
  if (!access_token) { console.log("access_token is null"); return null; }

  const userRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const account = userRes.data.kakao_account;
  console.log('account:', account);
  return {
    id: userRes.data.id,
    email: account.email,
    name: account.name,
    phone: formatPhoneNumber(account.phone_number),
    profile: account.profile.thumbnail_image_url,
    provider: "k",
  };
};


export const oauth = async (req: Request, res: Response) => {
  try {
    const { provider, code, keepLoggedIn } = req.body;
    console.log('provider:', provider);
    console.log('code:', code);
    let user;

    switch (provider) {
      case 'kakao':
        user = await handleKakao(code);
        console.log('user:', user);
        break;
      default:
        break;
    }

    if (user) {
      const existingUser = await UserModel.findByEmail(user.email);
      console.log('existingUser:', existingUser);
      if (!existingUser) { // 완전 신규회원 -> 추가 정보 입력 필요
        console.log("완전 신규회원")
        user = await UserModel.create(user);
        // res.status(201).json({ message: '회원가입이 완료되었습니다.' });
      } else if(!existingUser.provider) {  // 일반가입 했던 회원
        console.log("일반가입 했던 회원")
        res.status(409).json({ message: '이미 가입된 계정입니다. 다른 방법으로 로그인하세요.' });
      } else {
        console.log("이미 소셜회원가입 했던 회원")
        await UserModel.create({...existingUser, profile: user.profile});
      }
      console.log("로그인 과정 시작")
      console.log("existingUser.id:", existingUser?.id);
      console.log("user >>> ", user)
      console.log("user.id:", user.id);
      console.log("keepLoggedIn:", keepLoggedIn)
      const accessToken = generateAccessToken(Number(existingUser?.id ?? user.id), keepLoggedIn);
      const refreshToken = generateRefreshToken(Number(existingUser?.id ?? user.id), keepLoggedIn);
      console.log("accessToken:", accessToken);
      console.log("refreshToken:", refreshToken);

      const refreshExpiry = new Date();
      if (keepLoggedIn) {
        refreshExpiry.setDate(refreshExpiry.getDate() + 14);
      } else {
        refreshExpiry.setHours(refreshExpiry.getHours() + 1);
      }

      await RefreshTokenModel.create(Number(existingUser?.id ?? user.id), refreshToken, refreshExpiry);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: keepLoggedIn 
          ? 14 * 24 * 60 * 60 * 1000 // 14일
          : 1 * 60 * 60 * 1000,       // 1시간
      });

      res.status(!existingUser ? 201 : 200).json({
        id: user.id,
        accessToken,
      });
      
    }
  } catch (err) {
    console.error('회원가입 실패', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};
