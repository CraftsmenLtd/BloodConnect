export const validatePassword = (
  password: string,
  confirmPassword: string
): { isValid: boolean; error: string } => {
  const policy = {
    MinimumLength: 8,
    RequireUppercase: true,
    RequireLowercase: true,
    RequireNumbers: true,
    RequireSymbols: true,
  };

  const {
    MinimumLength,
    RequireUppercase,
    RequireLowercase,
    RequireNumbers,
    RequireSymbols,
  } = policy;

  if (password.length < MinimumLength) {
    return { isValid: false, error: `Password must be at least ${MinimumLength} characters long.` };
  }

  if (RequireUppercase && !/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter.' };
  }

  if (RequireLowercase && !/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter.' };
  }

  if (RequireNumbers && !/\d/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number.' };
  }

  if (RequireSymbols && !/[^a-zA-Z0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one symbol.' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match.' };
  }

  return { isValid: true, error: '' };
};
