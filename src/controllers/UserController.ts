import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { PaymentModel } from '../models/Payment';
import { RadiusService } from '../services/RadiusService';

export class UserController {
  /**
   * GET /api/user/profile/:user_id
   * Получить профиль пользователя
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userIdParam = req.params.user_id;

      if (Array.isArray(userIdParam)) {
        res.status(400).json({ error: 'Invalid user_id parameter' });
        return;
      }

      const user = await UserModel.findById(parseInt(userIdParam, 10));
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        id: user.id,
        mac_address: user.mac_address,
        phone: user.phone,
        phone_verified: user.phone_verified,
        email: user.email,
        created_at: user.created_at,
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/user/status/:user_id/:location_id
   * Статус доступа пользователя
   */
  static async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const userIdParam = req.params.user_id;
      const locationIdParam = req.params.location_id;

      if (Array.isArray(userIdParam) || Array.isArray(locationIdParam)) {
        res.status(400).json({ error: 'Invalid parameters' });
        return;
      }

      const user = await UserModel.findById(parseInt(userIdParam, 10));
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const activeSession = await UserModel.getActiveSession(
        parseInt(userIdParam, 10),
        parseInt(locationIdParam, 10)
      );

      // Получаем активные сессии из RADIUS
      const radiusSessions = await RadiusService.getActiveSessions(user.mac_address);

      res.json({
        user_id: user.id,
        mac_address: user.mac_address,
        has_active_session: !!activeSession,
        session: activeSession,
        radius_sessions: radiusSessions,
      });
    } catch (error) {
      console.error('Get status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/user/sessions/:user_id
   * История сессий пользователя
   */
  static async getSessions(req: Request, res: Response): Promise<void> {
    try {
      const userIdParam = req.params.user_id;

      if (Array.isArray(userIdParam)) {
        res.status(400).json({ error: 'Invalid user_id parameter' });
        return;
      }

      const user = await UserModel.findById(parseInt(userIdParam, 10));
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const sessions = await RadiusService.getSessionHistory(user.mac_address, 20);

      res.json({
        user_id: user.id,
        mac_address: user.mac_address,
        sessions,
      });
    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/user/payments/:user_id
   * История платежей пользователя
   */
  static async getPayments(req: Request, res: Response): Promise<void> {
    try {
      const userIdParam = req.params.user_id;

      if (Array.isArray(userIdParam)) {
        res.status(400).json({ error: 'Invalid user_id parameter' });
        return;
      }

      const payments = await PaymentModel.getUserPayments(parseInt(userIdParam, 10));

      res.json({
        user_id: parseInt(userIdParam, 10),
        payments,
      });
    } catch (error) {
      console.error('Get payments error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/user/stats/:user_id
   * Статистика использования
   */
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const userIdParam = req.params.user_id;

      if (Array.isArray(userIdParam)) {
        res.status(400).json({ error: 'Invalid user_id parameter' });
        return;
      }

      const user = await UserModel.findById(parseInt(userIdParam, 10));
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const stats = await RadiusService.getUserStats(user.mac_address);

      res.json({
        user_id: user.id,
        mac_address: user.mac_address,
        stats: {
          total_sessions: stats.totalSessions,
          total_input_mb: (stats.totalInputBytes / 1024 / 1024).toFixed(2),
          total_output_mb: (stats.totalOutputBytes / 1024 / 1024).toFixed(2),
          total_hours: (stats.totalSessionTime / 3600).toFixed(2),
        },
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
