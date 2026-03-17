import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate, requireAdmin } from './auth.middleware';
import { loginRateLimiter, authRateLimiter } from '../../middleware/rate-limit.middleware';
import { validate } from '../../utils/validate';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.validator';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), authController.register);

router.post('/login', loginRateLimiter, validate(loginSchema), authController.login);

router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);

router.post('/logout', authenticate, validate(logoutSchema), authController.logout);

router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);

router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);

router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), authController.resetPassword);

router.get('/me', authenticate, authController.getMe);

router.get('/seller/status', authenticate, authController.getSellerStatus);

router.post('/seller/request', authenticate, authController.requestSeller);

router.get('/admin/seller-requests', authenticate, requireAdmin, authController.getSellerRequests);

router.post('/admin/seller-requests/:userId/approve', authenticate, requireAdmin, authController.approveSeller);

router.post('/admin/seller-requests/:userId/reject', authenticate, requireAdmin, authController.rejectSeller);

export default router;
