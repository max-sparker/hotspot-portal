import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  API_BASE_URL: string;

  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;

  YOOKASSA_SHOP_ID: string;
  YOOKASSA_SECRET_KEY: string;
  YOOKASSA_RETURN_URL: string;
  YOOKASSA_WEBHOOK_URL: string;

  SMS_ENABLED: boolean;
  SMS_VERIFICATION_CODE: string;

  MIKROTIK_DORM_IP: string;
  MIKROTIK_CAFE_IP: string;

  DORM_PRICE_WEEK: number;
  CAFE_FREE_MINUTES: number;
}

export const config: EnvConfig = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',

  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_NAME: process.env.DB_NAME || 'radius',
  DB_USER: process.env.DB_USER || 'radius',
  DB_PASSWORD: process.env.DB_PASSWORD || '',

  YOOKASSA_SHOP_ID: process.env.YOOKASSA_SHOP_ID || '',
  YOOKASSA_SECRET_KEY: process.env.YOOKASSA_SECRET_KEY || '',
  YOOKASSA_RETURN_URL: process.env.YOOKASSA_RETURN_URL || '',
  YOOKASSA_WEBHOOK_URL: process.env.YOOKASSA_WEBHOOK_URL || '',

  SMS_ENABLED: process.env.SMS_ENABLED === 'true',
  SMS_VERIFICATION_CODE: process.env.SMS_VERIFICATION_CODE || '1234',

  MIKROTIK_DORM_IP: process.env.MIKROTIK_DORM_IP || '',
  MIKROTIK_CAFE_IP: process.env.MIKROTIK_CAFE_IP || '',

  DORM_PRICE_WEEK: parseInt(process.env.DORM_PRICE_WEEK || '30000', 10),
  CAFE_FREE_MINUTES: parseInt(process.env.CAFE_FREE_MINUTES || '120', 10),
};
