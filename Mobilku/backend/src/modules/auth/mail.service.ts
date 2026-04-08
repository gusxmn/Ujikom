import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initTransporter();
  }

  private async initTransporter() {
    const emailService = process.env.EMAIL_SERVICE || 'ethereal'; // ethereal || gmail
    
    if (emailService === 'gmail') {
      // Use Gmail with App Password
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER, // Gmail address
          pass: process.env.EMAIL_APP_PASSWORD, // App Password (not regular password)
        },
      });
      console.log('📧 Email service configured: Gmail');
    } else {
      // Development: Use Ethereal for testing
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('📧 Email service configured: Ethereal (Testing)');
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<{ url?: string }> {
    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
    const senderEmail = process.env.EMAIL_USER || 'support@mobilku.com';

    const mailOptions = {
      from: `"Mobilku Support" <${senderEmail}>`,
      to: email,
      subject: 'Password Reset Request - Mobilku',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Mobilku</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9fafb;">
            <h2 style="color: #1f2937; margin-top: 0;">Reset Your Password</h2>
            
            <p style="color: #4b5563; line-height: 1.6;">
              You requested a password reset for your Mobilku account.
            </p>
            
            <p style="color: #4b5563; line-height: 1.6;">
              Click the button below to reset your password (valid for 1 hour):
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
              Or copy this link:<br>
              <code style="background-color: #f3f4f6; padding: 10px; display: block; word-break: break-all; margin-top: 10px;">
                ${resetUrl}
              </code>
            </p>
            
            <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
              If you didn't request this, please ignore this email.
            </p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              © 2026 Mobilku. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully');
      console.log('📧 Email to:', email);
      console.log('🔗 Reset URL:', resetUrl);
      
      // For testing: return preview URL if Ethereal
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('👁️  Preview URL:', previewUrl);
        return { url: previewUrl };
      }
      
      return {};
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw error;
    }
  }

  async sendVerificationEmail(email: string, verificationToken: string): Promise<void> {
    const verifyUrl = `http://localhost:3000/verify-email?token=${verificationToken}`;
    const senderEmail = process.env.EMAIL_USER || 'support@mobilku.com';

    const mailOptions = {
      from: `"Mobilku Support" <${senderEmail}>`,
      to: email,
      subject: 'Verify Your Email - Mobilku',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Mobilku</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9fafb;">
            <h2 style="color: #1f2937; margin-top: 0;">Verify Your Email</h2>
            
            <p style="color: #4b5563; line-height: 1.6;">
              Welcome to Mobilku! Please verify your email address to complete your registration.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Verify Email
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
              Or copy this link:<br>
              <code style="background-color: #f3f4f6; padding: 10px; display: block; word-break: break-all; margin-top: 10px;">
                ${verifyUrl}
              </code>
            </p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              © 2026 Mobilku. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Verification email sent');
      
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('👁️  Preview URL:', previewUrl);
      }
    } catch (error) {
      console.error('❌ Error sending verification email:', error);
      throw error;
    }
  }
}
