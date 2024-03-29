export default interface Logger {
  readonly shouldLog: boolean;

  info(...message: string[]): void;
  debug(...message: string[]): void;
  warn(...message: string[]): void;
  error(...message: string[]): void;
}
