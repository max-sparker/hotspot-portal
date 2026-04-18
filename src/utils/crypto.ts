import crypto from 'crypto';

/**
 * Генерация случайного пароля
 */
export function generatePassword(length: number = 12): string {
  return crypto
    .randomBytes(length)
    .toString('base64')
    .slice(0, length);
}

/**
 * Генерация уникального ID для платежа
 */
export function generatePaymentId(): string {
  return `PAY-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Генерация SMS кода
 */
export function generateSmsCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
