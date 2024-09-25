export const EMAIL_VERIFICATION_TITLE = 'Welcome to Blood Connect!'
export const PASSWORD_RESET_TITLE = 'Reset your password for Blood Connect'

export const getEmailVerificationContent = (userName: string, securityCode: string): string => `
  Hello ${userName},<br/><br/>
  Welcome! Please verify your email using the following code: ${securityCode}.<br/><br/>
  Thanks!
`

export const getPasswordResetContent = (userName: string, securityCode: string): string => `
  Hello ${userName},<br/><br/>
  You have requested to reset your password.<br/>
  Use the following code to reset your password: ${securityCode}<br/><br/>
  If you did not request this, please ignore this email.<br/><br/>
  Thanks!
`
