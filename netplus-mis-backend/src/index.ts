/**
 * NetPlus MIS-AI Backend Server
 * Express API Server with MySQL Database Connection
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import { testConnection } from './config/database';

// 환경변수 로드
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API 라우트
app.use('/api', apiRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    name: 'NetPlus MIS-AI Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      dbTest: '/api/db/test',
      tables: '/api/db/tables',
      lotTrace: '/api/lot/trace/:lotNo',
      causalAnalysis: '/api/analysis/causal',
      defectAnalysis: '/api/analysis/defect/:defectType',
      sqlExecute: '/api/sql/execute'
    }
  });
});

// 서버 시작
async function startServer() {
  // DB 연결 테스트
  console.log('Testing database connection...');
  const dbConnected = await testConnection();

  if (dbConnected) {
    console.log('✅ Database connection successful');
  } else {
    console.log('⚠️ Database connection failed - server will start but DB features may not work');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
  });
}

startServer().catch(console.error);
