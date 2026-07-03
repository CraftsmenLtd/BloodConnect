# U4 History + Push — Deployment Architecture

## Packaging
- `core/services/aws/chat/chatGetHistory.ts` bundled by esbuild → `chatGetHistory.js`.
- OpenAPI document re-bundled (Redocly) to include the new `GET /chat/history` path.

## Terraform (consolidated in U6)
- `chat-get-history` Lambda (existing `lambda` module pattern) + `aws_lambda_permission` + read-only IAM.
- REST API picks up the new path from the OpenAPI document (existing deploy mechanism).

## Push
- No new resource — `CHAT_MESSAGE` reuses the existing SQS push queue + `send-push-notification` + SNS.

## Environments
- **AWS** (ap-south-1) + **LocalStack** — REST + DynamoDB read both supported locally.

## Rollout / Rollback
- **Rollout**: deploy Lambda + re-deploy REST API with the new path; ship the publish-only code change.
- **Rollback**: remove the path/Lambda → history endpoint gone (real-time chat unaffected); revert the
  publish-only branch → chat pushes fall back to the generic else-branch (still functional). No data
  migration.

## Validation
- `GET /chat/history?channelId=<id>` as a participant → newest-first page + `nextCursor`; as a
  non-participant → 403; malformed `cursor` → 400. Send a message to an offline recipient → exactly one
  SNS publish, **no** new notification record persisted.
