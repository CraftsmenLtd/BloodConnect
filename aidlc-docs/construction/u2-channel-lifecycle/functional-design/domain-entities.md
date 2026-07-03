# U2 Channel Lifecycle — Domain Entities

U2 introduces **no new persisted entities**. It reads existing items from the DynamoDB stream and
acts on U1's `ChatChannel` aggregate via `ChatChannelService`.

## Consumed stream items (read-only)
### Acceptance row (existing — `AcceptDonationModel`)
- `PK = BLOOD_REQ#<seekerId>`, `SK = ACCEPTED#<requestPostId>#<donorId>`
- Relevant NewImage attributes: `status` (`AcceptDonationStatus`), `createdAt` (= request createdAt).

### Donation-request row (existing — `BloodDonationModel`)
- `PK = BLOOD_REQ#<seekerId>`, `SK = BLOOD_REQ#<createdAt>#<requestPostId>`
- Relevant NewImage attributes: `status` (`DonationStatus`), `requestedBloodGroup`, `urgencyLevel`,
  `donationDateTime`, `location` (used for the channel context snapshot).

## New in-memory types (no persistence)
```
enum LifecycleAction { CREATE_CHANNEL, LOCK_REQUEST_CHANNELS, NOOP }
type ClassifyInput = { pk: string; sk: string; eventName: string; status?: string }
```

## Collaborators (existing services)
- `ChatChannelService` (U1) — createChannelIfAbsent, lockChannel.
- `BloodDonationService` — getDonationRequest (context).
- `AcceptDonationService` — getAcceptedDonorList (lock fan-out).

## New domain artifact
- `ChannelLifecycleService` (`core/application/chatWorkflow/ChannelLifecycleService.ts`) +
  `classifyStreamItem` pure helper.
