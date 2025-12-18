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
import fs from 'fs';
import crypto from 'crypto';
import { trackError } from '../utils/analytics';

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
    trackError(err, {
      message: 'AccessToken 생성 중 오류 발생',
      userId: userId,
      file: 'auth.controller.ts',
      function: 'generateAccessToken',
      severity: 'error'
    })
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
    trackError(err, {
      message: 'RefreshToken 생성 중 오류 발생',
      userId: userId,
      file: 'auth.controller.ts',
      function: 'generateRefreshToken',
      severity: 'error'
    })
    return null;
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { user } = req.body;
    const response = await UserModel.create(user);
    const accessToken = generateAccessToken(Number(response?.id ?? user.id), false);
    const refreshToken = generateRefreshToken(Number(response?.id ?? user.id), false);
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
    trackError(err, {
      message: '사용자 생성 중 오류 발생',
      userId: req.body?.user?.id,
      file: 'auth.controller.ts',
      function: 'createUser',
      severity: 'error'
    })
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

export const verifyResetToken = async (req: Request, res: Response) => {
  const { token } = req.query;
  try {
    const decoded = jwt.verify(token as string, authConfig.resetToken.secret as string);
    console.log(decoded);
    if ((decoded as any).provider === null || (decoded as any).provider === '') {
      res.status(200).json({ valid: true });
    } else {
      const provider = (decoded as any).provider === "k" ? "카카오" : (decoded as any).provider === "n" ? "네이버" : "구글";
      res.status(201).json({ valid: true, message: `${provider} 계정으로 가입된 사용자입니다.`});
    }
  } catch (err) {
    trackError(err, {
      message: '비밀번호 재설정 토큰 검증 중 오류 발생',
      token: req.query?.token,
      file: 'auth.controller.ts',
      function: 'verifyResetToken',
      severity: 'error'
    })
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
    trackError(err, {
      message: '로그인 중 오류 발생',
      email: req.body?.email,
      file: 'auth.controller.ts',
      function: 'login',
      severity: 'error'
    })
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
    trackError(err, {
      message: '토큰 리프레시 중 오류 발생',
      file: 'auth.controller.ts',
      function: 'refresh',
      severity: 'error'
    })
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
    trackError(err, {
      message: '로그아웃 중 오류 발생',
      file: 'auth.controller.ts',
      function: 'logout',
      severity: 'error'
    })
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

export const findAccount = async(req: Request, res: Response) => {
  try{
    const { name, phone } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: '이름 또는 전화번호가 제공되지 않았습니다.' });
    }
    const users = await UserModel.findByNamePhone(name, phone);
    if (users.length === 0) {
      return res.status(200).json({ result: false, message: '사용자를 찾을 수 없습니다.' });
    }
    return res.status(200).json({ result: true, users });
  } catch (error) {
    console.error('Error finding user by name and phone:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

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
        const primary = path.join(__dirname, '../utils/buildingshop_BI.png');
        const fallback = path.join(__dirname, '../src/utils/buildingshop_BI.png');

        const logoPath = fs.existsSync(primary) ? primary : fallback;
        
        await transporter.sendMail({
          from: `"빌딩샵AI(발신전용)" <${process.env.SMTP_EMAIL}>`,
          to: email,
          subject: '비밀번호 재설정 안내',
          html: resetPasswordMailTemplate(resetLink, readableExpires),
          attachments: [{
            filename: 'buildingshop_BI.png',
            path: logoPath,
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
    trackError(err, {
      message: '비밀번호 재설정 중 오류 발생',
      file: 'auth.controller.ts',
      function: 'pwFind',
      severity: 'error'
    })
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
        // if (process.env.NODE_ENV !== 'production') {
        if (req.get('host') === 'nexusnas.iptime.org:7500') {
          return res.json({ message: '⚠️ 정식 오픈 후 이용 가능합니다.' });
        }
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
    trackError(err, {
      message: 'OAuth 콜백 중 오류 발생',
      file: 'auth.controller.ts',
      function: 'oAuthCallback',
      severity: 'error'
    })
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
    social_id: userRes.data.id,
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
    social_id: account.id,
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
    social_id: account.id,
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
        await UserModel.update({...existingUser, profile: user.profile, socialId: user.social_id});
        console.log("existingUser.id:", existingUser?.id);
        const accessToken = generateAccessToken(Number(existingUser?.id), keepLoggedIn);
        const refreshToken = generateRefreshToken(Number(existingUser?.id), keepLoggedIn);

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
    console.error('소셜 로그인/회원가입 실패', err);
    trackError(err, {
      message: '소셜로그인 중 오류 발생',
      file: 'auth.controller.ts',
      function: 'oauth',
      severity: 'error'
    })
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

// DotProgress 로딩 HTML 생성 함수
const generateLoadingPageHTML = (options: {
  formHtml?: string;  // Optional form HTML for InitVerification
  scriptContent: string;  // Script to execute
}) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>본인인증</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #f5f5f5;
          }
          .dot-progress {
            display: flex;
            gap: 15px;
            align-items: flex-end;
            height: 40px;
          }
          .dot {
            width: 8px;
            height: 8px;
            background-color: #0062db;
            border-radius: 50%;
            animation: bounce 1.35s ease-in-out infinite;
          }
          .dot:nth-child(1) { animation-delay: 0s; }
          .dot:nth-child(2) { animation-delay: 0.15s; }
          .dot:nth-child(3) { animation-delay: 0.3s; }
          .dot:nth-child(4) { animation-delay: 0.45s; }
          @keyframes bounce {
            0%, 100% {
              transform: translateY(0) scale(1);
              opacity: 0.25;
            }
            20% {
              transform: translateY(-12px) scale(1.5);
              opacity: 1;
            }
            40% {
              transform: translateY(0) scale(1);
              opacity: 0.25;
            }
          }
        </style>
      </head>
      <body>
        ${options.formHtml || ''}
        <div class="dot-progress">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
        <script>${options.scriptContent}</script>
      </body>
    </html>
  `;
};

export const InitVerification = (req: Request, res: Response) => {
  try{
    const mid = process.env.KG_MID;
    const apiKey = process.env.KG_API_KEY;
    const callbackUrl = process.env.KG_CALLBACK_URL;

    if (!mid || !apiKey || !callbackUrl) {
      return res.status(500).send(`
        <html>
          <body>
            <h3>본인인증 설정 오류</h3>
            <p>서버 설정이 올바르지 않습니다.</p>
            <button onclick="window.close()">닫기</button>
          </body>
        </html>
      `);
    }

    // 거래 고유 ID 생성 (최대 20byte)
    const mTxId = `VRF${Date.now()}`;

    // authHash 생성: SHA256(mid + mTxId + apiKey)
    const hashData = mid + mTxId + apiKey;
    const authHash = crypto.createHash('sha256').update(hashData).digest('hex');

    const formHtml = `
      <form id="verificationForm" method="POST" action="https://sa.inicis.com/auth">
        <input type="hidden" name="mid" value="${mid}" />
        <input type="hidden" name="reqSvcCd" value="01" />
        <input type="hidden" name="mTxId" value="${mTxId}" />
        <input type="hidden" name="authHash" value="${authHash}" />
        <input type="hidden" name="flgFixedUser" value="N" />
        <input type="hidden" name="successUrl" value="${callbackUrl}" />
        <input type="hidden" name="failUrl" value="${callbackUrl}" />
      </form>
    `;

    const scriptContent = `document.getElementById('verificationForm').submit();`;

    const html = generateLoadingPageHTML({ formHtml, scriptContent });

    res.send(html);
  }catch(err){
    console.error("본인인증 초기화 에러:", err);
    trackError(err, {
      message: '본인인증 초기화 오류',
      file: 'auth.controller.ts',
      function: 'InitVerification',
      severity: 'error'
    })

    const scriptContent = `
      if (window.opener) {
        const errorMsg = ${JSON.stringify(err.message || '본인인증 초기화 중 오류가 발생했습니다.')};
        window.opener.postMessage({
          type: 'IDENTITY_VERIFICATION_ERROR',
          message: errorMsg
        }, '${process.env.FRONTEND_URL}');
      }
      window.close();
    `;

    res.status(500).send(generateLoadingPageHTML({ scriptContent }));
  }
}

// SEED 복호화 함수
const decryptSeed = (encryptedData: string): string => {
  try {
    const key = Buffer.from(process.env.KG_API_KEY || '', 'base64');
    const iv = Buffer.from(process.env.KG_SEED_IV || '');

    const decipher = crypto.createDecipheriv('seed-cbc', key, iv);
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.error("SEED 복호화 에러:", err);
    trackError(err, {
      message: 'SEED 복호화 오류',
      file: 'auth.controller.ts',
      function: 'decryptSeed',
      severity: 'error'
    })
    return encryptedData;
  }
};

export const VerificationCallback = async (req: Request, res: Response) => {
  try{
    const callbackData = req.body;
    const { resultCode, authRequestUrl, txId } = callbackData;

    // 인증 실패 시
    if (resultCode !== '0000') {
      const errorMsg = decodeURIComponent(callbackData.resultMsg || '인증에 실패했습니다');
      console.error("본인인증 실패:", errorMsg);

      const scriptContent = `
        if (window.opener) {
          const errorMsg = ${JSON.stringify(errorMsg)};
          window.opener.postMessage({
            type: 'IDENTITY_VERIFICATION_ERROR',
            message: errorMsg
          }, '${process.env.FRONTEND_URL}');
          window.close();
        }
      `;

      return res.send(generateLoadingPageHTML({ scriptContent }));
    }

    const userInfoResponse = await axios.post(
      authRequestUrl,
      {
        mid: process.env.KG_MID,
        txId: txId
      },
      {
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        timeout: 5000
      }
    );

    const userInfo = userInfoResponse.data;

    if (userInfo.resultCode === '0000') {
      const needDecryption = userInfo.userName && userInfo.userName.includes('==');

      const userData = {
        resultCode: userInfo.resultCode,
        userName: needDecryption ? decryptSeed(userInfo.userName) : userInfo.userName,
        userPhone: needDecryption ? decryptSeed(userInfo.userPhone) : userInfo.userPhone,
        userBirthday: needDecryption ? decryptSeed(userInfo.userBirthday) : userInfo.userBirthday,
        userCi: userInfo.userCi || '',
        userGender: userInfo.userGender || ''
      };

      const scriptContent = `
        if (window.opener) {
          const userData = ${JSON.stringify(userData)};
          window.opener.postMessage({
            type: 'IDENTITY_VERIFICATION_SUCCESS',
            data: userData
          }, '${process.env.FRONTEND_URL}');
          window.close();
        }
      `;

      res.send(generateLoadingPageHTML({ scriptContent }));
    } else {
      throw new Error(userInfo.resultMsg || '사용자 정보 조회 실패');
    }

  }catch(err){
    console.error("본인인증 콜백 에러:", err);
    trackError(err, {
      message: '본인인증 콜백 중 오류 발생',
      file: 'auth.controller.ts',
      function: 'VerificationCallback',
      severity: 'error'
    })

    const scriptContent = `
      if (window.opener) {
        const errorMsg = ${JSON.stringify(err.message || '본인인증 중 오류가 발생했습니다.')};
        window.opener.postMessage({
          type: 'IDENTITY_VERIFICATION_ERROR',
          message: errorMsg
        }, '${process.env.FRONTEND_URL}');
        window.close();
      }
    `;

    res.status(500).send(generateLoadingPageHTML({ scriptContent }));
  }
}
