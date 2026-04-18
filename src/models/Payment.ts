import { db } from '../config/database';
import { Payment, CreatePaymentDto } from '../types/payment.types';

export class PaymentModel {
  /**
   * Создать новый платёж
   */
  static async create(data: CreatePaymentDto): Promise<Payment> {
    const result = await db.query<Payment>(
      `INSERT INTO payments (user_id, location_id, amount, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [data.user_id, data.location_id, data.amount]
    );
    return result.rows[0];
  }

  /**
   * Найти платёж по ID
   */
  static async findById(id: number): Promise<Payment | null> {
    const result = await db.query<Payment>(
      'SELECT * FROM payments WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Найти платёж по Yookassa Payment ID
   */
  static async findByYookassaId(yookassaPaymentId: string): Promise<Payment | null> {
    const result = await db.query<Payment>(
      'SELECT * FROM payments WHERE yookassa_payment_id = $1',
      [yookassaPaymentId]
    );
    return result.rows[0] || null;
  }

  /**
   * Обновить статус платежа
   */
  static async updateStatus(
    paymentId: number,
    status: Payment['status'],
    yookassaPaymentId?: string
  ): Promise<Payment> {
    const result = await db.query<Payment>(
      `UPDATE payments 
       SET status = $1, 
           yookassa_payment_id = COALESCE($2, yookassa_payment_id),
           completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_at END
       WHERE id = $3
       RETURNING *`,
      [status, yookassaPaymentId || null, paymentId]
    );
    return result.rows[0];
  }

  /**
   * Получить историю платежей пользователя
   */
  static async getUserPayments(userId: number): Promise<Payment[]> {
    const result = await db.query<Payment>(
      `SELECT p.*, l.name as location_name 
       FROM payments p
       JOIN locations l ON p.location_id = l.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Получить последний успешный платёж пользователя для локации
   */
  static async getLastCompletedPayment(
    userId: number,
    locationId: number
  ): Promise<Payment | null> {
    const result = await db.query<Payment>(
      `SELECT * FROM payments 
       WHERE user_id = $1 
         AND location_id = $2 
         AND status = 'completed'
       ORDER BY completed_at DESC
       LIMIT 1`,
      [userId, locationId]
    );
    return result.rows[0] || null;
  }
}
