import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authConfig } from '../config/auth.config';
import { UserModel } from '../models/user.model';
import { RefreshTokenModel } from '../models/refresh-token.model';
import axios from 'axios';
import { resetPasswordMailTemplate, transporter } from "../utils/nodemailer";
const { randomUUID } = require('node:crypto');
import path from 'path';
import { Sentry } from '../instrument';

const generateAccessToken = (userId: number, auto: boolean): string => {
  try{
    console.log(`userId: ${userId}, auto: ${auto}`);
    const expiresIn = auto ? authConfig.expires.auto.accessToken : authConfig.expires.normal.accessToken;
    return jwt.sign(
      { id: userId },
      authConfig.secret as string,
      { expiresIn } as jwt.SignOptions
    );
  } catch (err) {
    console.error('Generate access token error:', err);
    Sentry.captureException(err);
    return null;
  }
};

const generateRefreshToken = (userId: number, auto: boolean): string => {
  try{
    const expiresIn = auto ? authConfig.expires.auto.refreshToken : authConfig.expires.normal.refreshToken;
    return jwt.sign(
      { id: userId },
      authConfig.refreshToken.secret as string,
      { expiresIn } as jwt.SignOptions
    );
  } catch (err) {
    console.error('Generate refresh token error:', err);
    Sentry.captureException(err);
    return null;
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { user } = req.body;
    const response = await UserModel.create(user);
    const accessToken = generateAccessToken(Number(response?.id ?? user.id), false);
    const refreshToken = generateRefreshToken(Number(response?.id ?? user.id), false);
    console.log("accessToken:", accessToken);
    console.log("refreshToken:", refreshToken);
    if (!accessToken || !refreshToken) {
      return res.status(500).json({ message: '토큰 생성에 실패했습니다.' });
    }

    const refreshExpiry = new Date();
    refreshExpiry.setHours(refreshExpiry.getHours() + 1);
    await RefreshTokenModel.create(Number(response?.id ?? user.id), refreshToken, refreshExpiry);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1 * 60 * 60 * 1000,       // 1시간
    });

    res.status(200).json({
      id: response.id,
      accessToken,
    });
    // res.status(201).json(response);
  } catch (err) {
    console.error('Create user error:', err);
    Sentry.captureException(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

export const verifyResetToken = async (req: Request, res: Response) => {
  const { token } = req.query;
  try {
    const decoded = jwt.verify(token as string, authConfig.resetToken.secret as string);
    if ((decoded as any).provider === null) {
      res.status(200).json({ valid: true });
    } else {
      const provider = (decoded as any).provider === "k" ? "카카오" : (decoded as any).provider === "n" ? "네이버" : "구글";
      res.status(201).json({ valid: true, message: `${provider} 계정으로 가입된 사용자입니다.`});
    }
  } catch (err) {
    Sentry.captureException(err);
    res.status(500).json({ valid: false });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, keepLoggedIn } = req.body;

    const user = await UserModel.findByEmail(email);
    if (!user || user.delete_yn === 'Y') {
      return res.status(210).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
      return res.status(210).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(Number(user.id), keepLoggedIn); 
    const refreshToken = generateRefreshToken(Number(user.id), keepLoggedIn);
    if (!accessToken || !refreshToken) {
      return res.status(500).json({ message: '토큰 생성에 실패했습니다.' });
    }

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
      accessToken,
    });
  } catch (err) {
    console.error('Login error:', err);
    Sentry.captureException(err);
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

    const storedToken = await RefreshTokenModel.findByToken(refreshToken);
    if (!storedToken) {
      return res.status(403).json({ message: '유효하지 않거나 만료된 refresh token입니다.' });
    }

    try {
      const decoded = jwt.verify(refreshToken, authConfig.refreshToken.secret as string) as { id: number };
      const newAccessToken = generateAccessToken(decoded.id, keepLoggedIn);
      const newRefreshToken = generateRefreshToken(decoded.id, keepLoggedIn);
      if (!newAccessToken || !newRefreshToken) {
        return res.status(500).json({ message: '토큰 생성에 실패했습니다.' });
      }

      const refreshExpiry = new Date();
      //  refreshExpiry.setDate(refreshExpiry.getDate() + 7); // 7 days from now 
      if (keepLoggedIn) {
        refreshExpiry.setDate(refreshExpiry.getDate() + 14); // 14일
      } else {
        refreshExpiry.setHours(refreshExpiry.getHours() + 1); // 1시간
      }
      await RefreshTokenModel.create(decoded.id, newRefreshToken, refreshExpiry);

      console.error('new access token:', newAccessToken);
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
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
    Sentry.captureException(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await RefreshTokenModel.deleteByToken(refreshToken);
    }
    res.clearCookie('refreshToken', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.status(200).json({ message: '로그아웃되었습니다.' });
  } catch (err) {
    console.error('Logout error:', err);
    Sentry.captureException(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

export const pwFind = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    console.log(email)
    if (!email) {
      return res.status(400).json({ message: '이메일이 제공되지 않았습니다.' });
    }
    const user = await UserModel.findByEmail(email);
    if (user) {
      const token = jwt.sign(
        { id: user.id, provider: user.provider }, 
        authConfig.resetToken.secret as string, 
        { expiresIn: authConfig.resetToken.expires } as jwt.SignOptions);
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      
      const expiresInStr = authConfig.resetToken.expires;

      let readableExpires = "";
      if (expiresInStr.endsWith("m")) {
        readableExpires = `${parseInt(expiresInStr)}분`;
      } else if (expiresInStr.endsWith("h")) {
        readableExpires = `${parseInt(expiresInStr)}시간`;
      } else if (expiresInStr.endsWith("d")) {
        readableExpires = `${parseInt(expiresInStr)}일`;
      } else {
        readableExpires = "일정시간";
      }

      try {
        await transporter.sendMail({
          from: `"빌딩샵AI" <${process.env.SMTP_EMAIL}>`,
          to: email,
          subject: '비밀번호 재설정 안내',
          html: resetPasswordMailTemplate(resetLink, readableExpires),
          attachments: [{
            filename: 'buildingshop_BI.png',
            path: path.join(__dirname, '../utils/buildingshop_BI.png'),
            cid: 'logo'
          }]
        });
      } catch (error) {
        console.error('메일 발송 실패:', error);
        return res.status(500).json({ message: '이메일 발송에 실패했습니다.' });
      }
    } else {
      console.log('User not found');
    }

    res.status(200).json({ message: '비밀번호 재설정 메일이 발송되었습니다.' });
  } catch (err) {
    console.error('Password find error:', err);
    Sentry.captureException(err);
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

export const oAuthCallback = (req: Request, res: Response) => {
  const {provider} = req.params;
  try{
    console.log("provider : ", provider)
    let redirectUrl: string | null = null;
    switch (provider) {
      case 'kakao':
        redirectUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${process.env.KAKAO_REST_API_KEY}&redirect_uri=${process.env.KAKAO_REDIRECT_URI}`;
        break;
      case 'naver':
        const stateNaver = randomUUID();
        res.cookie("oauth_state", stateNaver, {
          httpOnly: true,      
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", 
          maxAge: 10 * 60 * 1000, // 유효기간 10분
        });
        redirectUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${process.env.NAVER_CLIENT_ID}&redirect_uri=${process.env.NAVER_REDIRECT_URI}&state=${stateNaver}`;
        break;
      case 'google':
        const stateGoogle = randomUUID();
        res.cookie("oauth_state", stateGoogle, {
          httpOnly: true,      
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", 
          maxAge: 10 * 60 * 1000, // 유효기간 10분
        });
        redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&scope=openid%20email%20profile&state=${stateGoogle}`;
        break;
      default:
        return null;
    }

    res.json({ url: redirectUrl });
  }catch(err){
    Sentry.captureException(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

const handleKakao = async (code: string) => {
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
    password: userRes.data.id,
    email: account.email,
    name: account.name,
    phone: formatPhoneNumber(account.phone_number),
    profile: account.profile.thumbnail_image_url,
    provider: "k",
  };
};

const handleNaver = async (code: string) => {
  const tokenRes = await axios.post(
    "https://nid.naver.com/oauth2.0/token",
    null,
    {
      params: {
        grant_type: "authorization_code",
        client_id: process.env.NAVER_CLIENT_ID,
        client_secret: process.env.NAVER_CLIENT_SECRET,
        code,
      },
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    }
  );

  const access_token = tokenRes.data.access_token;
  console.log('access_token:', access_token);
  if (!access_token) { console.log("access_token is null"); return null; }

  const userRes = await axios.get("https://openapi.naver.com/v1/nid/me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const account = userRes.data.response;
  console.log('account:', account);
  return {
    password: account.id,
    email: account.email,
    name: account.name,
    phone: formatPhoneNumber(account.mobile),
    profile: account.profile_image,
    provider: "n",
  };
}

const handleGoogle = async(code: string) => {
  const tokenRes = await axios.post(
    "https://oauth2.googleapis.com/token",
    null,
    {
      params: {
        grant_type: "authorization_code",
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        code,
      },
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    }
  );

  const access_token = tokenRes.data.access_token;
  console.log('access_token:', access_token);
  if (!access_token) { console.log("access_token is null"); return null; }

  const userRes = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const account = userRes.data;
  console.log('account:', account);
  return {
    password: account.id,
    email: account.email,
    name: account.name,
    phone: null,
    profile: account.picture,
    provider: "g",
  };
}


export const oauth = async (req: Request, res: Response) => {
  try {
    const { provider, code, state, keepLoggedIn } = req.body;
    const cookieState = req.cookies.oauth_state;
    console.log(`provider: ${provider}, code: ${code}, state: ${state}, keepLoggedIn: ${keepLoggedIn}`);
    let user;

    switch (provider) {
      case 'kakao':
        user = await handleKakao(code);
        console.log('user:', user);
        break;
      case 'naver':
        console.log(`cookieState: ${cookieState}, state: ${state}`);
        if (cookieState !== state) {
          return res.status(400).json({ message: 'Invalid state' });
        }
        user = await handleNaver(code);
        console.log('user:', user);
        break;
      case 'google':
        console.log(`cookieState: ${cookieState}, state: ${state}`);
        if (cookieState !== state) {
          return res.status(400).json({ message: 'Invalid state' });
        }
        user = await handleGoogle(code);
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
        return res.status(206).json(user);
      } else if(existingUser.provider !== provider.slice(0, 1) || existingUser.delete_yn === 'Y') {  // 일반가입 했던 회원 || 탈퇴한 회원
        console.log("이미 가입된 회원")
        return res.status(208).json({ message: '회원을 찾을 수 없습니다.\n다른 방법으로 로그인하세요.' });
      } else {
        console.log("이미 소셜회원가입 했던 회원")
        await UserModel.update({...existingUser, profile: user.profile});
        console.log("existingUser.id:", existingUser?.id);
        const accessToken = generateAccessToken(Number(existingUser?.id), keepLoggedIn);
        const refreshToken = generateRefreshToken(Number(existingUser?.id), keepLoggedIn);
        console.log("accessToken:", accessToken);
        console.log("refreshToken:", refreshToken);

        const refreshExpiry = new Date();
        if (keepLoggedIn) {
          refreshExpiry.setDate(refreshExpiry.getDate() + 14);
        } else {
          refreshExpiry.setHours(refreshExpiry.getHours() + 1);
        }
        await RefreshTokenModel.create(Number(existingUser?.id), refreshToken, refreshExpiry);

        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: keepLoggedIn 
            ? 14 * 24 * 60 * 60 * 1000 // 14일
            : 1 * 60 * 60 * 1000,       // 1시간
        });

        res.status(200).json({
          id: existingUser.id,
          provider: existingUser.provider,
          accessToken,
        });
      }
    }
  } catch (err) {
    console.error('회원가입 실패', err);
    Sentry.captureException(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};
