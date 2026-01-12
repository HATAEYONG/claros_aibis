/**
 * Database Configuration
 * MySQL/MariaDB 연결 설정
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// 연결 풀 생성
const pool = mysql.createPool({
  host: process.env.DB_HOST || '133.186.214.219',
  port: parseInt(process.env.DB_PORT || '27455'),
  user: process.env.DB_USER || 'yh',
  password: process.env.DB_PASSWORD || 'db!@yh#$1!',
  database: process.env.DB_NAME || 'YH',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// 연결 테스트
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// 쿼리 실행 헬퍼
export async function query<T>(sql: string, params?: any[]): Promise<T> {
  try {
    const [results] = await pool.execute(sql, params);
    return results as T;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

// 테이블 목록 조회
export async function getTables(): Promise<string[]> {
  const results = await query<any[]>('SHOW TABLES');
  return results.map((row: any) => Object.values(row)[0] as string);
}

// 테이블 스키마 조회
export async function getTableSchema(tableName: string): Promise<any[]> {
  return query<any[]>(`DESCRIBE ${tableName}`);
}

export default pool;
