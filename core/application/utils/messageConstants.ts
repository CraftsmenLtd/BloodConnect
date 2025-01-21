export const EMAIL_VERIFICATION_TITLE = 'Welcome to Blood Connect!'
export const PASSWORD_RESET_TITLE = 'Reset your password for Blood Connect'
export const APP_USER_WELCOME_MAIL_TITLE = 'Welcome to BloodConnect: Thank You for Signing Up!'

export const EMAIL_VERIFICATION_CONTENT = `
  <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${EMAIL_VERIFICATION_TITLE}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            background-color: #FF4D4D;
            padding: 20px;
            text-align: center;
          }
          .header img {
            max-width: 150px;
            height: auto;
          }
          .content {
            padding: 20px;
            color: #333333;
            line-height: 1.6;
          }
          .otp-code {
            font-size: 24px;
            font-weight: bold;
            color: #FF4D4D;
            margin: 20px 0;
            text-align: center;
          }
          .footer {
            background-color: #f4f4f4;
            padding: 10px;
            text-align: center;
            font-size: 12px;
            color: #777777;
          }
          @media (max-width: 600px) {
            .email-container {
              width: 100%;
              border-radius: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <!-- Header with Logo -->
          <div class="header">
            <img 
              src="https://bloodconnect.net/img/logo/bloodconnect-transparent.png" 
              alt="Blood Connect Logo" 
              style="display: block; margin: 0 auto; width: auto; height: 80px; max-width: 200px;" 
            />
          </div>
        
          <!-- Email Content -->
          <div class="content">
            <p>Hello {0},</p>
            <p>Welcome! Please verify your email using the following code:</p>
            <div class="otp-code">{1}</div>
            <p>If you did not request this, please ignore this email.</p>
            <p>Thanks!</p>
          </div>
        
          <!-- Footer -->
          <div class="footer">
            <p>&copy; 2023-{2} BloodConnect. All rights reserved.</p>
          </div>
        </div>
        
        <!-- Plain Text Fallback (Hidden in HTML Clients) -->
        <div style="display: none; font-size: 0; line-height: 0;">
          Hello ${0},

          Welcome! Please verify your email using the following code: ${1}.
        
          If you did not request this, please ignore this email.
        
          Thanks!
        
          &copy; 2023-{2} BloodConnect. All rights reserved.
        </div>
      </body>
    </html>
`

export const PASSWORD_RESET_CONTENT = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${PASSWORD_RESET_TITLE}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          background-color: #FF4D4D;
          padding: 20px;
          text-align: center;
        }
        .header img {
          max-width: 150px;
          height: auto;
        }
        .content {
          padding: 20px;
          color: #333333;
          line-height: 1.6;
        }
        .otp-code {
          font-size: 24px;
          font-weight: bold;
          color: #FF4D4D;
          margin: 20px 0;
          text-align: center;
        }
        .footer {
          background-color: #f4f4f4;
          padding: 10px;
          text-align: center;
          font-size: 12px;
          color: #777777;
        }
        @media (max-width: 600px) {
          .email-container {
            width: 100%;
            border-radius: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header with Logo -->
        <div class="header">
          <img 
            src="https://bloodconnect.net/img/logo/bloodconnect-transparent.png" 
            alt="Blood Connect Logo" 
            style="display: block; margin: 0 auto; width: auto; height: 80px; max-width: 200px;" 
          />
        </div>
        
        <!-- Email Content -->
        <div class="content">
          <p>Hello {0},</p>
          <p>You have requested to reset your password.</p>
          <p>Use the following code to reset your password:</p>
          <div class="otp-code">{1}</div>
          <p>If you did not request this, please ignore this email.</p>
          <p>Thanks!</p>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p>&copy; 2023-{2} BloodConnect. All rights reserved.</p>
        </div>
      </div>
        
      <!-- Plain Text Fallback (Hidden in HTML Clients) -->
      <div style="display: none; font-size: 0; line-height: 0;">
        Hello {0},

        You have requested to reset your password.
        Use the following code to reset your password: {1}.
        
        If you did not request this, please ignore this email.
        
        Thanks!
        
        &copy; 2023-{2} BloodConnect. All rights reserved.
      </div>
    </body>
  </html>
`

export const APP_USER_WELCOME_MAIL_CONTENT = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${APP_USER_WELCOME_MAIL_TITLE}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          background-color: #FF4D4D;
          padding: 20px;
          text-align: center;
        }
        .header img {
          max-width: 150px;
          width: 100%;
          height: auto;
        }
        .content {
          padding: 20px;
          color: #333333;
          line-height: 1.6;
        }
        .footer {
          background-color: #f4f4f4;
          padding: 10px;
          text-align: center;
          font-size: 12px;
          color: #777777;
        }
        @media (max-width: 600px) {
          .email-container {
            width: 100%;
            border-radius: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header with Logo -->
        <div class="header">
          <img 
            src="https://bloodconnect.net/img/logo/bloodconnect-transparent.png" 
            alt="BloodConnect Logo" 
            style="display: block; margin: 0 auto; width: auto; height: 100px; max-width: 200px;" 
          />
        </div>
    
        <!-- Email Content -->
        <div class="content">
          <p>Hello {0},</p>
          <p>Welcome to BloodConnect! We're excited to have you as part of our growing community of blood donors and recipients.</p>
          <p>Thank you for taking the step to sign up and support this noble cause. Explore the app, and be ready to make a difference.</p>
          <p>Kind regards,</p>
          <p>The BloodConnect Team</p>
        </div>
    
        <!-- Footer -->
        <div class="footer">
          <p>&copy; 2023-{1} BloodConnect. All rights reserved.</p>
        </div>
      </div>
    
      <!-- Plain Text Fallback (Hidden in HTML Clients) -->
      <div style="display: none; font-size: 0; line-height: 0;">
        Hello {0},
    
        Welcome to BloodConnect! We're excited to have you as part of our growing community of blood donors and recipients.
    
        Thank you for taking the step to sign up and support this noble cause. Explore the app, and be ready to make a difference.
    
        Kind regards,
        The BloodConnect Team
    
        &copy; 2023-{1} BloodConnect. All rights reserved.
      </div>
    </body>
  </html>
`

export const BLOOD_REQUEST_MESSAGE_TEMPLATE = '{0} {1} blood needed | {2}'
