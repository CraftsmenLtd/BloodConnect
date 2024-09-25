import React, { ChangeEvent, useState } from 'react';
import { FaRegEye, FaRegEyeSlash } from '../../../presentation/assets/icons';
import InputField from '../../../presentation/components/input-fields/index';
import {
  PasswordState,
  PasswordValidator,
} from '../../../presentation/components/validators/Password';

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const PasswordField: React.FC<PasswordFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
}) => {
  const [validation, setValidation] = useState<PasswordState>({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    symbol: false,
  });
  const [showValidation, setShowValidation] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    const newValidation = {
      length: newValue.length >= 8,
      uppercase: /[A-Z]/.test(newValue),
      lowercase: /[a-z]/.test(newValue),
      number: /\d/.test(newValue),
      symbol: /[^\w\s]/.test(newValue),
    };
    setValidation(newValidation);
    setShowValidation(!Object.values(newValidation).every(Boolean));
  };

  const allPasswordConditionsMet = Object.values(validation).every(Boolean);

  return (
    <div className="relative">
      <InputField
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        label={label}
        value={value}
        onChange={handleChange}
        icon={
          showPassword ? (
            <FaRegEyeSlash
              onClick={() => {
                setShowPassword(!showPassword);
              }}
              size={22}
            />
          ) : (
            <FaRegEye
              onClick={() => {
                setShowPassword(!showPassword);
              }}
              size={22}
            />
          )
        }
      />
      {!allPasswordConditionsMet && showValidation && (
        <PasswordValidator validation={validation} />
      )}
    </div>
  );
};

export default PasswordField;
