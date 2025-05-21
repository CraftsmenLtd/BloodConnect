import React from 'clients/commons/platform/node_modules/@types/react'

type AlertProps = {
  type: 'success' | 'error' | 'warning';
  message: string;
};

const alertStyles = {
  success: 'bg-green-50 border-green-500 text-green-700',
  error: 'bg-red-50 border-red-500 text-red-700',
  warning: 'bg-orange-50 border-orange-500 text-orange-700',
}

const Alert: React.FC<AlertProps> = ({ type, message }) => (
  <div
    className={`border-l-4 p-3 my-2 text-center ${alertStyles[type]}`}
    role="alert"
  >
    <p>{message}</p>
  </div>
)

export default Alert
