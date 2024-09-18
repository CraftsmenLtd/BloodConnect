export const getAppUserWellcomeMailTemplate = (userName: string): { subject: string; body: string } => {
  return {
    subject: 'Welcome to BloodConnect: Thank You for Signing Up!',
    body: `Hello ${userName},<br/><br/>
          Welcome to BloodConnect! We’re excited to have you as part of our growing community of blood donors and recipients.<br/><br/>
          Thank you for taking the step to sign up and support this noble cause. Explore the app, and be ready to make a difference.<br/><br/>
          Kind regards,<br/>
          The BloodConnect Team`
  }
}
