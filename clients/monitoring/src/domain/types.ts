// Typed domain model — the post-unmarshal shape the UI works with.
// Raw DynamoDB AttributeValue items are converted in data/unmarshal.ts.

export type Wave = {
  retryCount: number;
  level: number;
  donorsFound: number;
  at: string;
}

export type DonorSearch = {
  seekerId: string;
  requestPostId: string;
  createdAt: string;
  status: string;
  completionReason?: string;
  currentLevel?: number;
  currentRetryCount?: number;
  donorsFoundSoFar?: number;
  targetDonors?: number;
  lastUpdatedAt?: string;
  waveHistory: Wave[];
}

export type BloodRequest = {
  seekerId: string;
  requestPostId: string;
  createdAt: string;
  requestedBloodGroup: string;
  bloodQuantity?: number;
  h3Res8: string;
  patientName: string;
  seekerName: string;
  location: string;
  latitude?: number;
  longitude?: number;
  urgencyLevel: string;
  status: string;
  donationDateTime: string;
  shortDescription: string;
  contactNumber: string;
}

export type NotifiedDonor = {
  donorId: string;
  status: string;
  distance: number;
  area: string;
  latitude: number;
  longitude: number;
}
