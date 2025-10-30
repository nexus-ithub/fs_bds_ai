export const authConfig = {
  secret: process.env.JWT_SECRET,
  refreshToken: {
    secret: process.env.REFRESH_TOKEN_SECRET!,
  },
  resetToken: {
    secret: process.env.RESET_TOKEN_SECRET!,
    expires: process.env.RESET_TOKEN_EXPIRES_IN!,
  },
  expires: {
    normal: {
      accessToken: process.env.JWT_EXPIRES_IN_NORMAL, 
      refreshToken: process.env.REFRESH_TOKEN_EXPIRES_IN_NORMAL, 
    },
    auto: {
      accessToken: process.env.JWT_EXPIRES_IN_AUTO, 
      refreshToken: process.env.REFRESH_TOKEN_EXPIRES_IN_AUTO, 
    },
  },
};
