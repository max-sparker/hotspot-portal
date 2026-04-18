import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { LocationModel } from '../models/Location';
import { SmsService } from '../services/SmsService';
import { RadiusService } from '../services/RadiusService';
import { normalizeMac } from '../utils/mac';
import { generatePassword } from '../utils/crypto';

const smsService = new SmsService();

export class AuthController {
  /**
   * POST /api/auth/request
   * Запрос авторизации - проверка MAC и статуса доступа
   */
  static async requestAuth(req: Request, res: Response): Promise<void> {
    try {
      const { mac_address, location_id } = req.body;

      // Нормализуем MAC
      const normalizedMac = normalizeMac(mac_address);

      // Проверяем локацию
      const location = await LocationModel.findById(location_id);
      if (!location) {
        res.status(404).json({ error: 'Location not found' });
        return;
      }

      // Ищем или создаём пользователя
      let user = await UserModel.findByMac(normalizedMac);
      if (!user) {
        user = await UserModel.createOrUpdate({ mac_address: normalizedMac });
      }

      // Проверяем активную сессию
      const activeSession = await UserModel.getActiveSession(user.id, location_id);

      // Если локация платная
      if (location.is_paid) {
        if (activeSession && activeSession.paid_until && activeSession.paid_until > new Date()) {
          // Есть оплаченная сессия
          res.json({
            status: 'authorized',
            session: activeSession,
            message: 'Access granted',
          });
          return;
        } else {
          // Нужна оплата
          res.json({
            status: 'payment_required',
            user_id: user.id,
            location,
            message: 'Payment required',
          });
          return;
        }
      }

      // Если локация бесплатная
      if (!location.is_paid) {
        // Если есть активная сессия - показываем что авторизован
        if (activeSession) {
          res.json({
            status: 'authorized',
            session: activeSession,
            message: 'Access granted',
          });
          return;
        }
        
        // Если нет активной сессии - требуем верификацию телефона
        res.json({
          status: 'verification_required',
          user_id: user.id,
          location,
          message: 'Phone verification required',
        });
        return;
      }
    } catch (error) {
      console.error('Auth request error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/auth/request-sms
   * Запрос SMS кода для верификации
   */
  static async requestSms(req: Request, res: Response): Promise<void> {
    try {
      const { phone, user_id } = req.body;

      // Проверяем пользователя
      const user = await UserModel.findById(user_id);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Обновляем телефон пользователя
      await UserModel.createOrUpdate({
        mac_address: user.mac_address,
        phone,
      });

      // Отправляем SMS
      await smsService.sendVerificationCode(phone);

      res.json({
        success: true,
        message: 'Verification code sent',
      });
    } catch (error) {
      console.error('SMS request error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/auth/verify-sms
   * Верификация SMS кода
   */
  static async verifySms(req: Request, res: Response): Promise<void> {
    try {
      const { phone, code, user_id, location_id } = req.body;

      // Проверяем код
      const isValid = await smsService.verifyCode(phone, code);
      if (!isValid) {
        res.status(400).json({ error: 'Invalid or expired code' });
        return;
      }

      // Подтверждаем телефон
      const user = await UserModel.verifyPhone(user_id);

      // Получаем локацию
      const location = await LocationModel.findById(location_id);
      if (!location) {
        res.status(404).json({ error: 'Location not found' });
        return;
      }

      // Создаём бесплатную сессию
      const paidUntil = new Date(Date.now() + location.free_minutes * 60 * 1000);
      const session = await UserModel.createSession(user.id, location_id, paidUntil);

      // Добавляем в RADIUS
      const password = generatePassword();
      await RadiusService.addUser(
        user.mac_address,
        password,
        location.free_minutes * 60,
        600
      );

      res.json({
        success: true,
        session,
        credentials: {
          username: user.mac_address,
          password,
        },
        message: 'Phone verified, access granted',
      });
    } catch (error) {
      console.error('SMS verification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/auth/logout
   * Выход из сессии
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const { session_id, username } = req.body;

      // Завершаем сессию в БД
      if (session_id) {
        await UserModel.endSession(session_id);
      }

      // Удаляем из RADIUS
      if (username) {
        await RadiusService.removeUser(username);
      }

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
