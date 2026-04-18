import { Router } from 'express';
import { body, param } from 'express-validator';
import { PaymentController } from '../controllers/PaymentController';
import { validate } from '../middleware/validator';

const router = Router();

/**
 * POST /api/payment/create
 * Создание платежа
 */
router.post(
  '/create',
  validate([
    body('user_id').isInt().withMessage('User ID must be an integer'),
    body('location_id').isInt().withMessage('Location ID must be an integer'),
  ]),
  PaymentController.createPayment
);

/**
 * POST /api/payment/webhook
 * Webhook от ЮКасса
 */
router.post('/webhook', PaymentController.handleWebhook);

/**
 * GET /api/payment/status/:payment_id
 * Статус платежа
 */
router.get(
  '/status/:payment_id',
  validate([
    param('payment_id').isInt().withMessage('Payment ID must be an integer'),
  ]),
  PaymentController.getPaymentStatus
);

export default router;
