# U2 Channel Lifecycle — Business Logic Model

Consumes the existing DynamoDB stream (`NEW_AND_OLD_IMAGES`) and drives chat-channel lifecycle using
U1's `ChatChannelService`. New domain unit: `ChannelLifecycleService` (AWS-agnostic). The Lambda
handler (`chatChannelCreator`, U2 Code Gen) parses stream records and delegates.

## Stream item classification (pure — `classifyStreamItem`)
```
input: { pk: string, sk: string, eventName: 'INSERT'|'MODIFY'|'REMOVE', status?: string }
ACCEPTANCE: pk starts 'BLOOD_REQ#' AND sk starts 'ACCEPTED#'
REQUEST:    pk starts 'BLOOD_REQ#' AND sk starts 'BLOOD_REQ#'

if eventName == REMOVE                          -> NOOP
if ACCEPTANCE and status == 'ACCEPTED'          -> CREATE_CHANNEL
if REQUEST   and status == 'COMPLETED'          -> LOCK_REQUEST_CHANNELS
otherwise                                       -> NOOP
```
Total + deterministic (PBT target).

## ChannelLifecycleService

### onAcceptanceAccepted(seekerId, requestPostId, donorId, requestCreatedAt, bloodDonationService, channelService)
```
request = bloodDonationService.getDonationRequest(seekerId, requestPostId, requestCreatedAt)
context = { requestedBloodGroup, urgencyLevel, donationDateTime, location } from request
channelService.createChannelIfAbsent({ seekerId, requestPostId, donorId, context })   # idempotent (US-1/US-2)
```

### onRequestCompleted(seekerId, requestPostId, acceptDonationService, channelService)
```
acceptedDonors = acceptDonationService.getAcceptedDonorList(seekerId, requestPostId)
for each donor: channelService.lockChannel(buildChannelId(requestPostId, donor.donorId))   # fan-out lock (US-3)
```

## Key derivation from stream keys
```
seekerId      = pk.replace('BLOOD_REQ#', '')
ACCEPTED sk   = 'ACCEPTED#<requestPostId>#<donorId>'   -> split('#') -> [_, requestPostId, donorId]
REQUEST  sk   = 'BLOOD_REQ#<createdAt>#<requestPostId>' -> [_, createdAt, requestPostId]
```

## Handler orchestration (chatChannelCreator — U2 Code Gen)
```
for each record in event.Records:
  try:
    item = unmarshall(record.dynamodb.NewImage)        # AWS adapter concern
    action = classifyStreamItem(...)
    switch action:
      CREATE_CHANNEL:          lifecycle.onAcceptanceAccepted(...)
      LOCK_REQUEST_CHANNELS:   lifecycle.onRequestCompleted(...)
      NOOP:                    continue
  catch error:
    log (no PII); push record.dynamodb.SequenceNumber/messageId to batchItemFailures   # retry
return { batchItemFailures }
```

## Idempotency & ordering
- `createChannelIfAbsent` makes duplicate ACCEPTED events safe (no duplicate channel) — PBT-04.
- `lockChannel` is conditional (`OPEN -> LOCKED`), so repeated COMPLETED events are safe.
- Out-of-order delivery tolerated: create-then-lock and lock-then-create both converge (lock on a
  missing channel is a logged no-op; a later create yields an OPEN channel — acceptable; the request
  is already COMPLETED so no messages will be sent, and a subsequent completion event re-locks).

## Error handling (SECURITY-15)
- Per-record isolation; partial-batch-failure reporting; fail-closed; structured logs without PII.
