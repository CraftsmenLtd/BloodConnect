import { getH3GridRing } from '../utils/h3'
import { H3_RES_8_EDGE_KM } from '../../../commons/libs/constants/NoMagicNumbers'
import type H3SearchRepository from '../models/policies/repositories/H3SearchRepository'
import type { DonorInHexResult } from '../models/policies/repositories/H3SearchRepository'
import type { Logger } from '../models/logger/Logger'
import type { DonorSearchConfig } from './Types'

const H3_RES_8_CENTER_SPACING_KM = H3_RES_8_EDGE_KM * Math.sqrt(3)

export class H3SearchService {
  constructor(
    protected readonly h3Repository: H3SearchRepository,
    protected readonly logger: Logger,
    protected readonly options: DonorSearchConfig
  ) { }

  /**
   * Accumulate hex cells from successive rings starting after `fromLevel`.
   * Stops when budget hit, the max search radius is reached, or the ring is
   * empty.
   */
  buildRingBatch(
    centerHex: string,
    fromLevel: number,
    leftoverCells: string[],
    maxCells: number
  ): { cells: string[]; finalLevel: number } {
    const cells = [...leftoverCells]
    let level = fromLevel
    const maxRingLevel = this.getMaxRingLevel()

    while (cells.length < maxCells && level < maxRingLevel) {
      level += 1
      const ring = getH3GridRing(centerHex, level, this.logger)
      if (ring.length === 0) break
      cells.push(...ring)
    }

    return { cells, finalLevel: level }
  }

  getMaxRingLevel(): number {
    return Math.max(0, Math.ceil(this.options.maxSearchRadiusKm / H3_RES_8_CENTER_SPACING_KM))
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
