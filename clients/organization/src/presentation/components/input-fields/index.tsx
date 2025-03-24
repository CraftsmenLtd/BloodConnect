import React from 'clients/commons/platform/node_modules/@types/react';

type InputFieldProps = {
  type: string;
  placeholder?: string;
  label?: string;
  className?: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
};

const InputField: React.FC<InputFieldProps> = ({
  type,
  placeholder = '',
  label = '',
  icon = null,
  className = 'input input-bordered w-full',
  value,
  onChange,
  onFocus,
  onBlur,
}) => {
  return (
    <div className="mb-4">
      <label className="mb-2.5 block font-medium">{label}</label>
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          className={className}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {icon != null && (
          <span className="absolute right-4 top-4 text-primary text-xl">
            {icon}
          </span>
        )}
      </div>
    </div>
  );
};

export default InputField;
