import { Resend } from 'resend';
import { env } from '../config/env';

const APP_NAME = 'AI Resume Tracker';
const OTP_EXPIRY_MINUTES = 10;
const RESEND_TESTING_LIMIT_MESSAGE = 'You can only send testing emails to your own email address';

const resendClient = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export const canSendTransactionalEmail = (): boolean => resendClient !== null;

export const sendVerificationOtpEmail = async ({
  email,
  name,
  otpCode,
}: {
  email: string;
  name: string;
  otpCode: string;
}): Promise<void> => {
  if (!resendClient) {
    throw new Error('RESEND_API_KEY is not configured.');
  }

  const response = await resendClient.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: email,
    subject: `${APP_NAME} verification code`,
    html: `
      <div style="font-family: Arial, sans-serif; background: #f8f5ef; color: #1d1b18; padding: 32px;">
        <div style="max-width: 520px; margin: 0 auto; background: #fffdf9; border: 1px solid #d9cfbf; border-radius: 18px; padding: 32px;">
          <p style="font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #8f846f; margin: 0 0 16px;">
            ${APP_NAME}
          </p>
          <h1 style="font-size: 28px; margin: 0 0 12px;">Verify your email</h1>
          <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
            Hi ${name}, use the verification code below to finish signing in to your account.
          </p>
          <div style="font-size: 32px; font-weight: 700; letter-spacing: 0.35em; text-align: center; background: #efe6da; color: #5a4a35; border-radius: 16px; padding: 18px 12px; margin: 0 0 20px;">
            ${otpCode}
          </div>
          <p style="font-size: 14px; line-height: 1.6; margin: 0; color: #5f584f;">
            This code expires in ${OTP_EXPIRY_MINUTES} minutes. If you did not request it, you can ignore this email.
          </p>
        </div>
      </div>
    `,
  });

  if (response.error) {
    if (response.error.message.includes(RESEND_TESTING_LIMIT_MESSAGE)) {
      throw new Error(
        'Resend is connected, but this account is still in testing mode. Verify a domain in Resend and update RESEND_FROM_EMAIL to send OTP emails to other recipients.'
      );
    }

    throw new Error(`Unable to send verification email: ${response.error.message}`);
  }
};
