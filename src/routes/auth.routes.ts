import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/AuthController';
import { validate } from '../middleware/validator';

const router = Router();

/**
 * POST /api/auth/request
 * Запрос авторизации
 */
router.post(
  '/request',
  validate([
    body('mac_address').exists().withMessage('MAC address is required'),
    body('location_id').exists().isInt().withMessage('Location ID must be an integer'),
  ]),
  AuthController.requestAuth
);

/**
 * POST /api/auth/request-sms
 * Запрос SMS кода
 */
router.post(
  '/request-sms',
  validate([
    body('phone').exists().withMessage('Phone is required'),
    body('user_id').exists().isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
  ]),
  AuthController.requestSms
);

/**
 * POST /api/auth/verify-sms
 * Проверка SMS кода
 */
router.post(
  '/verify-sms',
  validate([
    body('phone').exists().withMessage('Phone is required'),
    body('code').exists().isLength({ min: 4, max: 6 }).withMessage('Code must be 4-6 characters'),
    body('user_id').exists().isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
    body('location_id').exists().isInt({ min: 1 }).withMessage('Location ID must be a positive integer'),
  ]),
  AuthController.verifySms
);

/**
 * POST /api/auth/logout
 * Выход
 */
router.post('/logout', AuthController.logout);

export default router;
