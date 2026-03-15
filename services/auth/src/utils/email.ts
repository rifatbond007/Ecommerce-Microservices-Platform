import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

export interface SendVerificationEmailParams {
  email: string;
  username: string;
  token: string;
}

export async function sendVerificationEmail({ email, username, token }: SendVerificationEmailParams): Promise<void> {
  const verifyUrl = `${config.app.url}/verify-email?token=${token}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background-color: #4F46E5; 
          color: white; 
          text-decoration: none; 
          border-radius: 6px; 
          font-weight: bold;
        }
        .footer { margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Welcome, ${username}!</h2>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <p>
          <a href="${verifyUrl}" class="button">Verify Email</a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p>${verifyUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <div class="footer">
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: config.email.from,
      to: email,
      subject: 'Verify Your Email Address',
      html: htmlContent,
    });

    logger.info('Verification email sent', { email });
  } catch (error) {
    logger.error('Failed to send verification email', { email, error });
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${config.app.url}/reset-password?token=${token}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background-color: #4F46E5; 
          color: white; 
          text-decoration: none; 
          border-radius: 6px; 
          font-weight: bold;
        }
        .footer { margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Reset Your Password</h2>
        <p>You requested to reset your password. Click the button below:</p>
        <p>
          <a href="${resetUrl}" class="button">Reset Password</a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <div class="footer">
          <p>If you didn't request a password reset, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: config.email.from,
      to: email,
      subject: 'Reset Your Password',
      html: htmlContent,
    });

    logger.info('Password reset email sent', { email });
  } catch (error) {
    logger.error('Failed to send password reset email', { email, error });
    throw error;
  }
}
