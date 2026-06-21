import { useCallback, useEffect, useState } from 'react'
import { useDdbClient } from '../../data/ddbClient'
import { toDonorSearch } from '../../data/unmarshal'
import {
  queryActiveSearches,
  queryStuckSearches,
  queryUnderservedSearches
} from '../../queries/Requests'
import { ONE_HOUR_IN_MS, STUCK_AFTER_MS } from '../../constants/constants'
import type { DonorSearch } from '../../domain/types'

export type LiveCounts = {
  active: number;
  stuck: number;
  underserved: number;
  lastHour: number;
}

export type LiveFeedState = {
  active: DonorSearch[];
  stuckIds: Set<string>;
  counts: LiveCounts;
  loading: boolean;
  error: string | null;
  lastUpdatedAt: number | null;
}

const initial: LiveFeedState = {
  active: [],
  stuckIds: new Set(),
  counts: { active: 0, stuck: 0, underserved: 0, lastHour: 0 },
  loading: true,
  error: null,
  lastUpdatedAt: null,
}

export const useLiveFeed = () => {
  const client = useDdbClient()
  const [state, setState] = useState<LiveFeedState>(initial)

  const refresh = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true }))
    const stuckBeforeIso = new Date(Date.now() - STUCK_AFTER_MS).toISOString()

    Promise.all([
      queryActiveSearches(client),
      queryStuckSearches(client, { stuckBeforeIso }),
      queryUnderservedSearches(client)
    ])
      .then(([activeRes, stuckRes, underservedRes]) => {
        const active = activeRes.items.map(toDonorSearch)
        const stuck = stuckRes.items.map(toDonorSearch)
        const stuckIds = new Set(stuck.map((search) => search.requestPostId))
        const sinceHour = Date.now() - ONE_HOUR_IN_MS
        const lastHour = active.filter(
          (search) => new Date(search.createdAt).getTime() >= sinceHour).length

        setState({
          active,
          stuckIds,
          counts: {
            active: active.length,
            stuck: stuck.length,
            underserved: underservedRes.items.length,
            lastHour,
          },
          loading: false,
          error: null,
          lastUpdatedAt: Date.now(),
        })
      })
      .catch((err) => setState(
        (prev) => ({ ...prev, loading: false, error: String(err) })))
  }, [client])

  useEffect(() => { refresh() }, [refresh])

  return { ...state, refresh }
}
