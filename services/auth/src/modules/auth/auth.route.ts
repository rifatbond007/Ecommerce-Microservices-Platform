import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from './auth.middleware';
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

export default router;
