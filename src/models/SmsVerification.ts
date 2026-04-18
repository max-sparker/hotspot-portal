import { db } from '../config/database';

export interface SmsVerification {
  id: number;
  phone: string;
  code: string;
  verified: boolean;
  expires_at: Date;
  created_at: Date;
}

export class SmsVerificationModel {
  /**
   * Создать новую верификацию
   */
  static async create(phone: string, code: string, expiresIn: number = 300): Promise<SmsVerification> {
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const result = await db.query<SmsVerification>(
      `INSERT INTO sms_verifications (phone, code, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [phone, code, expiresAt]
    );
    return result.rows[0];
  }

  /**
   * Найти активную верификацию
   */
  static async findActive(phone: string, code: string): Promise<SmsVerification | null> {
    const result = await db.query<SmsVerification>(
      `SELECT * FROM sms_verifications 
       WHERE phone = $1 
         AND code = $2 
         AND verified = false 
         AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [phone, code]
    );
    return result.rows[0] || null;
  }

  /**
   * Отметить верификацию как выполненную
   */
  static async markAsVerified(id: number): Promise<void> {
    await db.query(
      'UPDATE sms_verifications SET verified = true WHERE id = $1',
      [id]
    );
  }

  /**
   * Очистить старые записи
   */
  static async cleanup(): Promise<void> {
    await db.query(
      'DELETE FROM sms_verifications WHERE expires_at < NOW()'
    );
  }
}
