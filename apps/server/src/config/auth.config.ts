export const authConfig = {
  secret: process.env.JWT_SECRET,
  accessToken: {
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
  refreshToken: {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
    secret: process.env.REFRESH_TOKEN_SECRET
  }
};
