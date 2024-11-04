interface DonorSearchInput {
  geohash: string;
  eligibleDonorsCount: number;
  totalDonorsToNotify: number;
}

interface DonorSearchOutput {
  action: 'EnoughDonorsFound' | 'UpdateSearchFields';
  shortenedGeohash?: string;
}

async function donorSearchEvaluator(event: DonorSearchInput): Promise<DonorSearchOutput> {
  const { geohash, eligibleDonorsCount, totalDonorsToNotify } = event

  if (eligibleDonorsCount >= totalDonorsToNotify) {
    return { action: 'EnoughDonorsFound' }
  } else if (geohash.length > 2) {
    const shortenedGeohash = geohash.slice(0, -1)
    return {
      action: 'UpdateSearchFields',
      shortenedGeohash
    }
  } else {
    return { action: 'EnoughDonorsFound' }
  }
}

export default donorSearchEvaluator
