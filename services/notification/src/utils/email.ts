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

export interface SendEmailParams {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, toName, subject, html, text }: SendEmailParams): Promise<void> {
  try {
    await transporter.sendMail({
      from: `"${config.serviceName}" <${config.email.from}>`,
      to: toName ? `"${toName}" <${to}>` : to,
      subject,
      html,
      text,
    });
    logger.info(`Email sent to ${to}`, { subject });
  } catch (error) {
    logger.error(`Failed to send email to ${to}`, { error, subject });
    throw error;
  }
}

export function buildOrderConfirmationHtml(order: { orderNumber: string; total: number; items: Array<{ name: string; quantity: number; totalPrice: number }> }): string {
  const itemsHtml = order.items.map((item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${Number(item.totalPrice).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; border: 1px solid #e5e7eb; border-top: none; }
        table { width: 100%; border-collapse: collapse; }
        th { padding: 8px; border-bottom: 2px solid #333; text-align: left; }
        .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 16px; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmed!</h1>
        </div>
        <div class="content">
          <p>Thank you for your order!</p>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <table>
            <thead>
              <tr><th>Item</th><th>Qty</th><th>Price</th></tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div class="total">Total: $${Number(order.total).toFixed(2)}</div>
        </div>
        <div class="footer">
          <p>If you have any questions, please contact our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function buildPaymentReceiptHtml(payment: { transactionId: string; amount: number; currency: string }): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; border: 1px solid #e5e7eb; border-top: none; }
        .amount { font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; color: #059669; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Receipt</h1>
        </div>
        <div class="content">
          <p>Your payment has been processed successfully.</p>
          <p><strong>Transaction ID:</strong> ${payment.transactionId}</p>
          <div class="amount">${payment.currency} ${Number(payment.amount).toFixed(2)}</div>
        </div>
        <div class="footer">
          <p>Thank you for your business!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function buildWelcomeEmailHtml(username: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; border: 1px solid #e5e7eb; border-top: none; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to E-Commerce!</h1>
        </div>
        <div class="content">
          <p>Hi ${username},</p>
          <p>Thank you for creating an account! We're excited to have you on board.</p>
          <p>Start exploring our products and enjoy a seamless shopping experience.</p>
        </div>
        <div class="footer">
          <p>If you didn't create this account, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function buildOrderStatusHtml(order: { orderNumber: string; status: string }): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563EB; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; border: 1px solid #e5e7eb; border-top: none; }
        .status { font-size: 18px; text-align: center; margin: 20px 0; padding: 12px; background: #DBEAFE; border-radius: 6px; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Update</h1>
        </div>
        <div class="content">
          <p>Your order <strong>${order.orderNumber}</strong> has been updated.</p>
          <div class="status">Status: <strong>${order.status.toUpperCase()}</strong></div>
        </div>
        <div class="footer">
          <p>Track your order in your account dashboard.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
