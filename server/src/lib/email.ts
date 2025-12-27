import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from './logger';

// Create a transporter using SMTP settings from env (or default to Ethereal for dev)
const createTransporter = async () => {
  // For production, you should use a real SMTP service like SendGrid, AWS SES, etc.
  // For now, we'll try to use env vars, and fallback to ethereal if not provided.

  // Check if env vars are provided and NOT the placeholder defaults
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.SMTP_HOST !== 'your_smtp_host') {
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT || '587'),
      secure: env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  // Fallback to Ethereal for development if no SMTP config
  if (env.NODE_ENV !== 'production') {
    const testAccount = await nodemailer.createTestAccount();
    logger.info(`Created Ethereal test account: ${testAccount.user}`);

    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  throw new Error('SMTP configuration missing in production');
};

let transporter: nodemailer.Transporter | null = null;

const getTransporter = async () => {
  if (!transporter) {
    transporter = await createTransporter();
  }
  return transporter;
};

export const sendApprovalRequestEmail = async (
  recipientEmail: string,
  requesterName: string,
  requesterRole: string,
  approveLink?: string, // Optional, could just be a notification
) => {
  try {
    const transport = await getTransporter();
    const info = await transport.sendMail({
      from: env.SMTP_USER
        ? `"GridironHub" <${env.SMTP_USER}>`
        : '"GridironHub" <noreply@gridironhub.com>',
      to: recipientEmail,
      subject: `New ${requesterRole} Registration Pending Approval`,
      html: `
        <h1>New Registration Request</h1>
        <p>A new ${requesterRole} has registered and requires approval.</p>
        <p><strong>Name:</strong> ${requesterName}</p>
        <p><strong>Role:</strong> ${requesterRole}</p>
        <p>Please log in to the dashboard to approve or reject this request.</p>
      `,
    });

    logger.info(`Approval request email sent to ${recipientEmail}: ${info.messageId}`);
    if (nodemailer.getTestMessageUrl(info)) {
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (error) {
    logger.error(error, `Failed to send approval request email to ${recipientEmail}`);
  }
};

export const sendSetPasswordEmail = async (recipientEmail: string, resetLink: string) => {
  try {
    const transport = await getTransporter();
    const info = await transport.sendMail({
      from: env.SMTP_USER
        ? `"GridironHub" <${env.SMTP_USER}>`
        : '"GridironHub" <noreply@gridironhub.com>',
      to: recipientEmail,
      subject: 'Welcome! Set Your Password',
      html: `
        <h1>Welcome to GridironHub!</h1>
        <p>Your account has been approved.</p>
        <p>Please click the link below to set your password and activate your account:</p>
        <a href="${resetLink}">Set Password</a>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });

    logger.info(`Set password email sent to ${recipientEmail}: ${info.messageId}`);
    if (nodemailer.getTestMessageUrl(info)) {
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (error) {
    logger.error(error, `Failed to send set password email to ${recipientEmail}`);
  }
};
