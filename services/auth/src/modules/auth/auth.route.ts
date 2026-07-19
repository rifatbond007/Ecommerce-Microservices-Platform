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

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, username]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       '201':
 *         description: User registered successfully
 *       '400':
 *         description: Validation error
 *       '429':
 *         description: Rate limit exceeded
 */
router.post('/register', authRateLimiter, validate(registerSchema), authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       '200':
 *         description: Login successful
 *       '401':
 *         description: Invalid credentials
 *       '429':
 *         description: Rate limit exceeded
 */
router.post('/login', loginRateLimiter, validate(loginSchema), authController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Token refreshed successfully
 *       '401':
 *         description: Invalid refresh token
 */
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout and invalidate refresh token
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Logged out successfully
 *       '401':
 *         description: Unauthorized
 */
router.post('/logout', authenticate, validate(logoutSchema), authController.logout);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change account password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       '200':
 *         description: Password changed successfully
 *       '400':
 *         description: Current password is incorrect
 *       '401':
 *         description: Unauthorized
 */
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Email verified successfully
 *       '400':
 *         description: Invalid or expired token
 */
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       '200':
 *         description: Password reset email sent
 *       '429':
 *         description: Rate limit exceeded
 */
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       '200':
 *         description: Password reset successfully
 *       '400':
 *         description: Invalid or expired token
 *       '429':
 *         description: Rate limit exceeded
 */
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), authController.resetPassword);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Current user details
 *       '401':
 *         description: Unauthorized
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @swagger
 * /auth/seller/status:
 *   get:
 *     tags: [Auth]
 *     summary: Get seller status for current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Seller status
 *       '401':
 *         description: Unauthorized
 */
router.get('/seller/status', authenticate, authController.getSellerStatus);

/**
 * @swagger
 * /auth/seller/request:
 *   post:
 *     tags: [Auth]
 *     summary: Request seller role
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [businessName]
 *             properties:
 *               businessName:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Seller request submitted
 *       '401':
 *         description: Unauthorized
 */
router.post('/seller/request', authenticate, authController.requestSeller);

/**
 * @swagger
 * /auth/admin/seller-requests:
 *   get:
 *     tags: [Auth]
 *     summary: List pending seller requests (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of pending seller requests
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Admin access required
 */
router.get('/admin/seller-requests', authenticate, requireAdmin, authController.getSellerRequests);

/**
 * @swagger
 * /auth/admin/seller-requests/{userId}/approve:
 *   post:
 *     tags: [Auth]
 *     summary: Approve seller request (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to approve as seller
 *     responses:
 *       '200':
 *         description: Seller request approved
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Admin access required
 */
router.post('/admin/seller-requests/:userId/approve', authenticate, requireAdmin, authController.approveSeller);

/**
 * @swagger
 * /auth/admin/seller-requests/{userId}/reject:
 *   post:
 *     tags: [Auth]
 *     summary: Reject seller request (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to reject as seller
 *     responses:
 *       '200':
 *         description: Seller request rejected
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Admin access required
 */
router.post('/admin/seller-requests/:userId/reject', authenticate, requireAdmin, authController.rejectSeller);

export default router;
