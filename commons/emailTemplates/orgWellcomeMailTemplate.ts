export const getOrgWellcomeMailTemplate = (orgName: string): { subject: string; body: string } => {
  return {
    subject: 'Welcome to BloodConnect: Thank You for Signing Up!',
    body: `Hello ${orgName},<br/><br/>
          We are thrilled to welcome you to BloodConnect! By signing up as an organization, you're now part of a life-saving community dedicated to connecting donors and recipients in need.<br/><br/>
          We look forward to working with you in making a positive impact. Together, we can save more lives.<br/><br/>
          Thank you for joining us!<br/><br/>
          Warm regards,<br/>
          The BloodConnect Team`
  }
}
