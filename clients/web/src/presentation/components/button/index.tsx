import React from 'react';

interface ButtonProps {
  type: string;
  value: string;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}
const Button: React.FC<ButtonProps> = ({
  type,
  value,
  className,
  disabled,
  onClick,
}) => {
  return (
    <input
      type={type}
      value={value}
      className={className}
      disabled={disabled}
      onClick={onClick}
    />
  );
};

export default Button;
