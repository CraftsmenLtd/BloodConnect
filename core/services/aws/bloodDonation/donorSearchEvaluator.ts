interface DonorSearchInput {
  geohash: string;
  eligibleDonorsCount: number;
  totalDonorsToNotify: number;
  eligibleDonors: Array<{ PK: { S: string } }>;
}

interface DonorSearchOutput {
  action: 'EnoughDonorsFound' | 'UpdateSearchFields';
  userIds?: string[];
  shortenedGeohash?: string;
}

async function donorSearchEvaluator(event: DonorSearchInput): Promise<DonorSearchOutput> {
  const { geohash, eligibleDonorsCount, totalDonorsToNotify, eligibleDonors } = event

  const userIds = eligibleDonors.map(donor => donor.PK.S.split('#')[1])

  if (eligibleDonorsCount >= totalDonorsToNotify) {
    return { action: 'EnoughDonorsFound', userIds }
  } else if (geohash.length > 2) {
    const shortenedGeohash = geohash.slice(0, -1)
    return {
      action: 'UpdateSearchFields',
      shortenedGeohash,
      userIds
    }
  } else {
    return { action: 'EnoughDonorsFound', userIds }
  }
}

export default donorSearchEvaluator
