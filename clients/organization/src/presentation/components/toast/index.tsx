type ToastProps = {
  msg: string;
  className: string;
  visible: boolean;
};

export function Toast({ msg, className, visible }: ToastProps) {
  if (!visible) return null

  return (
    <div className="toast toast-top toast-end">
      <div className={`alert ${className}`}>
        <span>{msg}</span>
      </div>
    </div>
  )
}
