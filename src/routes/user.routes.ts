import { Router } from 'express';
import { param } from 'express-validator';
import { UserController } from '../controllers/UserController';
import { validate } from '../middleware/validator';

const router = Router();

/**
 * GET /api/user/profile/:user_id
 */
router.get(
  '/profile/:user_id',
  validate([
    param('user_id').isInt().withMessage('User ID must be an integer'),
  ]),
  UserController.getProfile
);

/**
 * GET /api/user/status/:user_id/:location_id
 */
router.get(
  '/status/:user_id/:location_id',
  validate([
    param('user_id').isInt().withMessage('User ID must be an integer'),
    param('location_id').isInt().withMessage('Location ID must be an integer'),
  ]),
  UserController.getStatus
);

/**
 * GET /api/user/sessions/:user_id
 */
router.get(
  '/sessions/:user_id',
  validate([
    param('user_id').isInt().withMessage('User ID must be an integer'),
  ]),
  UserController.getSessions
);

/**
 * GET /api/user/payments/:user_id
 */
router.get(
  '/payments/:user_id',
  validate([
    param('user_id').isInt().withMessage('User ID must be an integer'),
  ]),
  UserController.getPayments
);

/**
 * GET /api/user/stats/:user_id
 */
router.get(
  '/stats/:user_id',
  validate([
    param('user_id').isInt().withMessage('User ID must be an integer'),
  ]),
  UserController.getStats
);

export default router;
