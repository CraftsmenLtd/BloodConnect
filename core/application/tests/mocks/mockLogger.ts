import { Logger } from "core/application/models/logger/Logger";

export const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
} as unknown as jest.Mocked<Logger>