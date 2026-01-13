import "./instrument";
import { Sentry } from "./instrument";
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import https from 'https';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.routes';
import { db } from './utils/database';
import { verifyToken } from "./middleware/auth.middleware";
import userRoutes from './routes/user.routes';
import landRoutes from './routes/land.routes';
import youtubeRoutes from './routes/youtube.routes';
import bdsRoutes from './routes/bds.routes';
import { bdsDb } from './utils/bds-database';
import searchRoutes from './routes/search.routes';
import chatRoutes from './routes/chat.routes';
import politicianRoutes from './routes/politician.routes';
import { posthog } from './utils/analytics';
import { setupExpressErrorHandler } from 'posthog-node';
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

let httpServer: http.Server | https.Server;
// if (process.env.NODE_ENV === 'production') {
//   // --- 운영 환경: HTTPS ---
//   console.log('🚀 Production mode: Initializing HTTPS server.');
//   // const privateKey = fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/privkey.pem', 'utf8');
//   // const certificate = fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/fullchain.pem', 'utf8');
//   // const credentials = { key: privateKey, cert: certificate };
//   // httpServer = https.createServer(credentials, app);
// } else {
//   // --- 개발 환경: HTTP ---
//   console.log('☕️ Development mode: Initializing HTTP server.');
//   httpServer = http.createServer(app);
// }

console.log('☕️ Development mode: Initializing HTTP server.');
httpServer = http.createServer(app);

// const io = new Server(httpServer, {
//   cors: {
//     origin: process.env.NODE_ENV === 'production' 
//       ? 'https://your-production-frontend-domain.com' 
//       : 'http://localhost:3000',
//     methods: ['GET', 'POST'],
//     credentials: true,
//   },
// });


// export { io };

// 허용할 도메인 목록
const allowedOrigins = process.env.NODE_ENV === 'production' ? [
  'https://buildingshopai.com',
  'https://www.buildingshopai.com',
  'https://sa.inicis.com',
  'https://kssa.inicis.com'
] : [
  'http://localhost:3000',
  'http://192.168.0.164:3000',
  'http://nexusnas.iptime.org:7500',
  'https://sa.inicis.com',
  'https://kssa.inicis.com'
];

// app.use((req, res, next) => {
//   console.log('request url', req.url)
//   console.log('request headers', req.headers)

//   if (process.env.NODE_ENV === 'production') {
//     // 1. 보안 연결(HTTPS)인지 확인
//     if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
//       next();
//     } else {
//       // 2. HTTP인 경우 HTTPS로 리다이렉트
//       res.redirect(301, `https://${req.headers.host}${req.url}`);
//     }
//   }
// });

// app.use(cors());
app.use(cors({
  origin: (origin, callback) => {
    console.log('request origin', origin);
    // origin이 없는 경우 (예: Postman, 서버 내부 요청, 팝업 등)
    if (!origin || origin === 'null') return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  '/static/images', // URL prefix
  express.static('/mnt/static/images') // 실제 서버 디렉토리
);


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/land', landRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/bds', bdsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/politician', politicianRoutes);
app.use('/api/*', verifyToken);

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

// PostHog error handler (자동 에러 캡처)
setupExpressErrorHandler(posthog, app);

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  Sentry.captureException(err);
  res.status(500).json({ message: '서버 오류가 발생했습니다.' });
});

// Initialize database connection and start server
const startServer = async () => {
  try {
    await db.connect();
    // await bdsDb.connect();
    // app.listen(port, () => {
    //   console.log(`Server is running on port ${port}`);
    // });
    httpServer.listen(port, () => {
      console.log(`✅ Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await Sentry.flush(2000);
  await db.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await Sentry.flush(2000);
  await db.disconnect();
  process.exit(0);
});

startServer();
