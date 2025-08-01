import type { ChangeEvent } from 'clients/commons/platform/node_modules/@types/react'
import React, { useState } from 'clients/commons/platform/node_modules/@types/react'
import { FaRegEye, FaRegEyeSlash } from '../../assets/icons'
import InputField from './index'
import PasswordCriteriaChecker from '../validators/Password'

type ValidationResult = {
  message: string;
  isValid: boolean;
};

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  validationResults: ValidationResult[];
};

const PasswordField: React.FC<PasswordFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  validationResults,
}) => {
  const [showPassword, setShowPassword] = useState<boolean>(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
  }

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
                setShowPassword(!showPassword)
              }}
              size={22}
            />
          ) : (
            <FaRegEye
              onClick={() => {
                setShowPassword(!showPassword)
              }}
              size={22}
            />
          )
        }
      />
      {value !== '' && (
        <PasswordCriteriaChecker validationResults={validationResults} />
      )}
    </div>
  )
}

export default PasswordField
