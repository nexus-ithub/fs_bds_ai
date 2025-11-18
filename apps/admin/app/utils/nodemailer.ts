import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: process.env.SMTP_HOST,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_APPKEY,
  },
});

export const resetPasswordMailTemplate = (resetLink: string, readableExpires: string) => `
  <!DOCTYPE html>
  <html lang="ko">
    <head>
      <meta charset="UTF-8" />
      <title>비밀번호 재설정</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color:#f9f9f9; padding:20px;">
      <div style="max-width:600px; margin:0 auto; background:#fff; padding:20px; border-radius:8px; box-shadow:0 0 10px rgba(0,0,0,0.1);">
        <div style="text-align:left; margin-bottom:30px;">
          <img src="cid:logo" 
            alt="BUILDINGSHOPAI" 
            width="220" 
            style="display:block; height:auto; object-fit:contain; -ms-interpolation-mode:bicubic;" />
        </div>
        <h2 style="color:#333;">비밀번호 재설정</h2>
        <p>아래 버튼을 눌러 비밀번호를 재설정해주세요.</p>
        <div style="text-align:left; margin:30px 0;">
          <a href="${resetLink}" target="_blank"
            style="padding:12px 24px; background:#4f46e5; color:white; text-decoration:none; border-radius:6px; font-weight:bold;">
            비밀번호 재설정하기
          </a>
        </div>
        <p style="color:#555;">이 링크는 이메일 발송 시점으로부터 ${readableExpires} 동안 유효합니다.</p>
        <p style="color:#999; font-size:12px;">본인이 요청하지 않은 메일이라면, 안전을 위해 링크를 클릭하지 마시기 바랍니다.</p>
        <div style="margin-top:50px; padding-top:20px; border-top:1px solid #eee; color:#666; font-size:12px;">
          <p style="margin:5px 0;"><strong>BUILDINGSHOPAI</strong></p>
          <p style="margin:5px 0;">서울특별시 강남구 테헤란로 425, 11층 (삼성동, 신일빌딩)</p>
          <p style="margin:5px 0;">고객센터: buildingshopai@gmail.com  |  02-558-7222</p>
          <p style="margin:15px 0 5px 0;">
            <a href="https://chip-flare-463.notion.site/29b1c63ec1af80cdbfcfe2ca191d8e15?source=copy_link" style="color:#666; text-decoration:none;">개인정보처리방침</a>
            <span style="margin: 0 10px;">|</span>
            <a href="https://chip-flare-463.notion.site/29b1c63ec1af80f99a43dc87641afb7c?source=copy_link" style="color:#666; text-decoration:none;">이용약관</a>
          </p>
          <p style="margin:15px 0 0 0; color:#999;">© BUILDINGSHOPAI. All rights reserved.</p>
          <p style="margin:5px 0; color:#999; font-size:11px;">이 메일은 자동으로 발송되었습니다. 회신하지 말아주세요.</p>
        </div>
      </div>
    </body>
  </html>
`;
