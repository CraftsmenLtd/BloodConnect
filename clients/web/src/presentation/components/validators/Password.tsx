import React from 'react';

export type PasswordState = {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  symbol: boolean;
}

type PasswordValidatorProps = {
  validation: PasswordState;
}

export const PasswordValidator: React.FC<PasswordValidatorProps> = ({
  validation,
}) => {
  return (
    <ul className="mb-3">
      <li style={{ color: validation.length ? 'green' : 'red' }}>
        Minimum 8 characters
      </li>
      <li style={{ color: validation.uppercase ? 'green' : 'red' }}>
        At least one uppercase letter
      </li>
      <li style={{ color: validation.lowercase ? 'green' : 'red' }}>
        At least one lowercase letter
      </li>
      <li style={{ color: validation.number ? 'green' : 'red' }}>
        At least one number
      </li>
      <li style={{ color: validation.symbol ? 'green' : 'red' }}>
        At least one symbol
      </li>
    </ul>
  );
};
