import React from 'clients/commons/platform/node_modules/@types/react'

type ButtonProps = {
  type: string;
  value: string;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
};
const Button: React.FC<ButtonProps> = ({
  type,
  value,
  className,
  disabled,
  onClick,
}) => (
  <input
    type={type}
    value={value}
    className={className}
    disabled={disabled}
    onClick={onClick}
  />
)

export default Button
