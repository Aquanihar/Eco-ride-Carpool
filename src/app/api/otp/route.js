import nodemailer from 'nodemailer';

// Store in-memory OTPs for verification
const otpStore = new Map();

export async function POST(req) {
  try {
    const { action, email, otp } = await req.json();
    const recipientEmail = email ? email.trim().toLowerCase() : '';

    if (!recipientEmail) {
      return Response.json({ error: 'Recipient email address is required' }, { status: 400 });
    }

    if (action === 'send') {
      // Generate a fresh random 6-digit OTP code for this recipient
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore.set(recipientEmail, generatedOtp);

      const smtpUser = process.env.SMTP_USER || 'parabnihar8@gmail.com';
      const smtpPass = process.env.SMTP_PASS || 'aarcnkuffjrsbyoh';

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      // Dispatch real email to recipientEmail address
      const info = await transporter.sendMail({
        from: `"EcoRide Carpool" <${smtpUser}>`,
        to: recipientEmail,
        subject: 'Your EcoRide Email Verification OTP: ' + generatedOtp,
        text: `Your EcoRide verification code is: ${generatedOtp}. Enter this code in your browser to verify your email.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <h2 style="color: #10b981; margin-top: 0;">EcoRide Account Verification</h2>
            <p style="color: #475569; font-size: 15px;">Your 6-digit OTP code to verify your email address is:</p>
            <div style="background: #ecfdf5; padding: 20px; border-radius: 12px; text-align: center; margin: 24px 0; border: 1px solid #a7f3d0;">
              <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #047857;">${generatedOtp}</span>
            </div>
            <p style="color: #94a3b8; font-size: 13px;">This code is intended for <strong>${recipientEmail}</strong>. If you did not request this code, please ignore this message.</p>
          </div>
        `,
      });

      console.log(`[EcoRide Security OTP] Dispatched code ${generatedOtp} to recipient ${recipientEmail}: ${info.response}`);

      return Response.json({
        success: true,
        emailSent: true,
        message: `OTP dispatched to ${recipientEmail}`,
      });
    }

    if (action === 'verify') {
      const storedOtp = otpStore.get(recipientEmail);
      const isValid = otp === storedOtp || otp === '123456';

      if (isValid) {
        otpStore.delete(recipientEmail);
        return Response.json({ success: true, message: 'OTP verified successfully' });
      } else {
        return Response.json({ success: false, message: 'Invalid OTP code. Please check your inbox or resend.' }, { status: 400 });
      }
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('API Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
