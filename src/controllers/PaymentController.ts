import { Request, Response } from 'express';
import { PaymentModel } from '../models/Payment';
import { UserModel } from '../models/User';
import { LocationModel } from '../models/Location';
import { YookassaService } from '../services/YookassaService';
import { RadiusService } from '../services/RadiusService';
import { generatePassword } from '../utils/crypto';

const yookassaService = new YookassaService();

export class PaymentController {
  /**
   * POST /api/payment/create
   * Создание платежа
   */
  static async createPayment(req: Request, res: Response): Promise<void> {
    try {
      const { user_id, location_id } = req.body;

      // Проверяем пользователя
      const user = await UserModel.findById(user_id);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Проверяем локацию
      const location = await LocationModel.findById(location_id);
      if (!location) {
        res.status(404).json({ error: 'Location not found' });
        return;
      }

      if (!location.is_paid) {
        res.status(400).json({ error: 'Location is free' });
        return;
      }

      // Создаём платёж в БД
      const payment = await PaymentModel.create({
        user_id,
        location_id,
        amount: location.price_per_week,
      });

      // Создаём платёж в ЮКасса
      const yookassaPayment = await yookassaService.createPayment({
        amount: location.price_per_week,
        description: `Доступ к WiFi: ${location.name} (1 неделя)`,
        metadata: {
          payment_db_id: payment.id.toString(),
          user_id: user_id.toString(),
          location_id: location_id.toString(),
        },
      });

      // Обновляем платёж в БД
      await PaymentModel.updateStatus(payment.id, 'processing', yookassaPayment.id);

      res.json({
        success: true,
        payment_id: payment.id,
        confirmation_url: yookassaPayment.confirmation?.confirmation_url,
        amount: location.price_per_week,
      });
    } catch (error) {
      console.error('Payment creation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/payment/webhook
   * Webhook от ЮКасса
   */
  static async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;

      // Обрабатываем webhook
      const webhookData = await yookassaService.handleWebhook(payload);

      // Находим платёж в БД
      const payment = await PaymentModel.findByYookassaId(webhookData.paymentId);
      if (!payment) {
        console.error('Payment not found for webhook:', webhookData.paymentId);
        res.status(404).json({ error: 'Payment not found' });
        return;
      }

      // Обновляем статус
      if (webhookData.status === 'succeeded' && webhookData.paid) {
        await PaymentModel.updateStatus(payment.id, 'completed');

        // Получаем пользователя и локацию
        const user = await UserModel.findById(payment.user_id);
        const location = await LocationModel.findById(payment.location_id);

        if (user && location) {
          // Создаём сессию на неделю
          const paidUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          await UserModel.createSession(user.id, location.id, paidUntil);

          // Добавляем в RADIUS
          const password = generatePassword();
          await RadiusService.addUser(
            user.mac_address,
            password,
            7 * 24 * 60 * 60, // 7 дней
            3600 // 1 час idle
          );

          console.log(`✅ Payment completed for user ${user.mac_address}`);
        }
      } else if (webhookData.status === 'canceled') {
        await PaymentModel.updateStatus(payment.id, 'cancelled');
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/payment/status/:payment_id
   * Проверка статуса платежа
   */
  static async getPaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const paymentIdParam = req.params.payment_id;

      // Проверяем что это строка, а не массив
      if (Array.isArray(paymentIdParam)) {
        res.status(400).json({ error: 'Invalid payment_id parameter' });
        return;
      }

      const payment = await PaymentModel.findById(parseInt(paymentIdParam, 10));
      if (!payment) {
        res.status(404).json({ error: 'Payment not found' });
        return;
      }

      res.json({
        payment_id: payment.id,
        status: payment.status,
        amount: payment.amount,
        created_at: payment.created_at,
        completed_at: payment.completed_at,
      });
    } catch (error) {
      console.error('Get payment status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
