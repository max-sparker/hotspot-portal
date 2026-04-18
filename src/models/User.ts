import { db } from '../config/database';
import { User, CreateUserDto, UserSession } from '../types/user.types';

export class UserModel {
  /**
   * Найти пользователя по MAC-адресу
   */
  static async findByMac(macAddress: string): Promise<User | null> {
    const result = await db.query<User>(
      'SELECT * FROM users WHERE mac_address = $1',
      [macAddress]
    );
    return result.rows[0] || null;
  }

  /**
   * Найти пользователя по телефону
   */
  static async findByPhone(phone: string): Promise<User | null> {
    const result = await db.query<User>(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    );
    return result.rows[0] || null;
  }

  /**
   * Найти пользователя по ID
   */
  static async findById(id: number): Promise<User | null> {
    const result = await db.query<User>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Создать или обновить пользователя
   */
  static async createOrUpdate(data: CreateUserDto): Promise<User> {
    const result = await db.query<User>(
      `INSERT INTO users (mac_address, phone, email)
       VALUES ($1, $2, $3)
       ON CONFLICT (mac_address) DO UPDATE 
       SET phone = COALESCE($2, users.phone),
           email = COALESCE($3, users.email)
       RETURNING *`,
      [data.mac_address, data.phone || null, data.email || null]
    );
    return result.rows[0];
  }

  /**
   * Подтвердить телефон
   */
  static async verifyPhone(userId: number): Promise<User> {
    const result = await db.query<User>(
      'UPDATE users SET phone_verified = true WHERE id = $1 RETURNING *',
      [userId]
    );
    return result.rows[0];
  }

  /**
   * Получить активную сессию пользователя
   */
  static async getActiveSession(
    userId: number,
    locationId: number
  ): Promise<UserSession | null> {
    const result = await db.query<UserSession>(
      `SELECT * FROM user_sessions 
       WHERE user_id = $1 
         AND location_id = $2 
         AND is_active = true 
         AND (paid_until IS NULL OR paid_until > NOW())
       ORDER BY paid_until DESC NULLS LAST
       LIMIT 1`,
      [userId, locationId]
    );
    return result.rows[0] || null;
  }

  /**
   * Создать новую сессию
   */
  static async createSession(
    userId: number,
    locationId: number,
    paidUntil: Date | null = null
  ): Promise<UserSession> {
    const result = await db.query<UserSession>(
      `INSERT INTO user_sessions (user_id, location_id, paid_until, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING *`,
      [userId, locationId, paidUntil]
    );
    return result.rows[0];
  }

  /**
   * Продлить сессию
   */
  static async extendSession(
    sessionId: number,
    paidUntil: Date
  ): Promise<UserSession> {
    const result = await db.query<UserSession>(
      `UPDATE user_sessions 
       SET paid_until = $1 
       WHERE id = $2 
       RETURNING *`,
      [paidUntil, sessionId]
    );
    return result.rows[0];
  }

  /**
   * Завершить сессию
   */
  static async endSession(sessionId: number): Promise<void> {
    await db.query(
      'UPDATE user_sessions SET is_active = false WHERE id = $1',
      [sessionId]
    );
  }
}
