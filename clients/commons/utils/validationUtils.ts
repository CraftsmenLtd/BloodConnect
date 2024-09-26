const PASSWORD_MINIMUM_LENGTH = Number(process.env.PASSWORD_MINIMUM_LENGTH);

type ValidationResult = {
  message: string;
  isValid: boolean;
};

export const validatePassword = (
  password: string,
  confirmPassword: string
): {
  passwordResults: ValidationResult[];
  confirmPasswordResult: ValidationResult;
} => {
  const passwordResults: ValidationResult[] = [];

  const isLengthValid = password.length >= PASSWORD_MINIMUM_LENGTH;
  passwordResults.push({
    message: `Min ${PASSWORD_MINIMUM_LENGTH} characters.`,
    isValid: isLengthValid,
  });

  const isUppercaseValid = /[A-Z]/.test(password);
  passwordResults.push({
    message: 'At least one uppercase letter.',
    isValid: isUppercaseValid,
  });

  const isLowercaseValid = /[a-z]/.test(password);
  passwordResults.push({
    message: 'At least one lowercase letter.',
    isValid: isLowercaseValid,
  });

  const isNumberValid = /\d/.test(password);
  passwordResults.push({
    message: 'At least one number.',
    isValid: isNumberValid,
  });

  const isSymbolValid = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  passwordResults.push({
    message: 'At least one special character.',
    isValid: isSymbolValid,
  });

  const confirmPasswordResult: ValidationResult = {
    message:
      password === confirmPassword
        ? 'Passwords match.'
        : 'Passwords do not match.',
    isValid: password === confirmPassword,
  };

  return { passwordResults, confirmPasswordResult };
};
