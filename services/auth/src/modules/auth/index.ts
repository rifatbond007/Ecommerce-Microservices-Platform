export { AuthService, authService } from './auth.service';
export { AuthController, authController } from './auth.controller';
export { authenticate, optionalAuth, AuthenticatedRequest } from './auth.middleware';
export { default as authRoutes } from './auth.route';

export type { LoginInput, RegisterInput, ForgotPasswordInput, ResetPasswordInput, ChangePasswordInput, RefreshTokenInput, LogoutInput, VerifyEmailInput } from './auth.validator';
export type { AuthTokens, AuthResponse, UserResponse, RegisterInput as RegisterInputType, LoginInput as LoginInputType } from './auth.types';
