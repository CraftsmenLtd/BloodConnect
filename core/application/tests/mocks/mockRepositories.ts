import { mockQueryResult } from './mockDonationRequestData'

export const mockRepository = {
  create: jest.fn(),
  update: jest.fn(),
  getItem: jest.fn(),
  query: jest.fn().mockResolvedValue(mockQueryResult)
}

export type MockRepository = typeof mockRepository
