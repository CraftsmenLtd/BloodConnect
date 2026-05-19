import { getH3GridRing } from '../utils/h3'
import type H3SearchRepository from '../models/policies/repositories/H3SearchRepository'
import type { DonorInHexResult } from '../models/policies/repositories/H3SearchRepository'
import type { Logger } from '../models/logger/Logger'
import type { DonorSearchConfig } from './Types'

export class H3SearchService {
  constructor(
    protected readonly h3Repository: H3SearchRepository,
    protected readonly logger: Logger,
    protected readonly options: DonorSearchConfig
  ) { }

  /**
   * Accumulate hex cells from successive rings starting after `fromLevel`.
   * Stops when budget hit OR no new cells produced.
   */
  buildRingBatch(
    centerHex: string,
    fromLevel: number,
    leftoverCells: string[],
    maxCells: number
  ): { cells: string[]; finalLevel: number } {
    const cells = [...leftoverCells]
    let level = fromLevel

    while (cells.length < maxCells) {
      level += 1
      const ring = getH3GridRing(centerHex, level)
      if (ring.length === 0) break
      cells.push(...ring)
    }

    return { cells, finalLevel: level }
  }

  async queryDonorsInHex(
    countryCode: string,
    bloodGroup: string,
    h3Cell: string,
    limit: number
  ): Promise<DonorInHexResult[]> {
    return this.h3Repository.queryDonorsInHex(countryCode, bloodGroup, h3Cell, limit)
  }
}
