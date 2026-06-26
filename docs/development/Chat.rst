====
Chat
====

The chat workflow gives a donor and a seeker a private, in-app conversation
scoped to a single donation request, so they can coordinate without exposing
phone numbers. A channel is created automatically the moment a donor's
acceptance turns ``ACCEPTED`` and is locked when the donation completes or is
ignored.

A channel is uniquely identified by the triplet
``(seekerId, requestPostId, donorId)``. Its ``channelId`` is a deterministic
hash of that triplet (``core/application/utils/chatChannel.ts``) so that
stream-driven creation stays idempotent across redeliveries.

High-level flow
~~~~~~~~~~~~~~~

1. **A donor accepts a request.** ``AcceptDonationService`` writes an
   acceptance record with ``status = ACCEPTED`` to the main DynamoDB table.
2. **DynamoDB Stream → EventBridge Pipe** (``chat_channel_pipe``) filters for
   the accepted record and invokes the ``createChatChannel`` lambda, which
   idempotently creates the channel plus a per-user inbox row for both
   participants.
3. **Clients open a websocket** to the chat WebSocket API. A Cognito-backed
   Lambda authorizer validates the access token (passed as the ``token``
   query parameter) and attaches ``userId`` to the connection context.
4. **Sending a message** (``sendMessage`` route) rate limits the sender,
   persists the message, then delivers it over websocket to the recipient and
   the sender's other devices. If the recipient has no active connection, it
   falls back to a ``CHAT_MESSAGE`` push notification carrying a channel
   deep-link.
5. **History and inbox** are read over REST (``GET /chat/inbox`` and
   ``GET /chat/{channelId}/messages``). History reads enforce that the caller
   is a participant of the channel.
6. **Locking.** When the acceptance turns ``COMPLETED`` or ``IGNORED`` the
   ``chat_lock_pipe`` invokes the ``lockChatChannel`` lambda; a locked channel
   rejects new messages.

Storage
~~~~~~~

Chat data lives in a dedicated table, ``<env>-bloodConnect-chat-table``, with a
TTL on ``expiresAt`` (messages purge after 90 days; connection rows expire
after 12 hours).

.. list-table::
   :header-rows: 1

   * - Entity
     - PK
     - SK
     - Index / TTL
   * - Channel
     - ``CHANNEL#<channelId>``
     - ``META``
     - \-
   * - Message
     - ``CHANNEL#<channelId>``
     - ``MSG#<createdAt>#<msgId>``
     - TTL
   * - Connection
     - ``CONN#<connectionId>``
     - ``META``
     - GSI1 ``USER#<userId>`` / ``CONN#<connectionId>``; TTL
   * - Inbox row
     - ``USER#<userId>``
     - ``CHANNEL#<channelId>``
     - \-
   * - Rate window
     - ``RATE#<userId>``
     - ``MIN#<epochMinute>``
     - TTL

Inbox is a ``begins_with`` query on ``USER#<userId>``; finding a peer's live
connections is a ``begins_with`` query on the ``GSI1`` partition
``USER#<userId>``.

Components
~~~~~~~~~~

Domain (``core/application/chatWorkflow/``)
  ``ChatService`` (channel creation, message send with locked/participant
  guards, history/inbox reads, unread bookkeeping) and
  ``ChatConnectionService`` (websocket connection registry). Both depend only
  on repository ports, keeping the layer free of AWS SDK imports.

Handlers (``core/services/aws/chat/``)
  ``createChatChannel`` and ``lockChatChannel`` (stream-driven),
  ``chatAuthorizer`` / ``chatConnect`` / ``chatDisconnect`` / ``chatSendMessage``
  (websocket), and ``getChatInbox`` / ``getChatHistory`` (REST).

Infrastructure (``iac/terraform/aws/chat/``)
  The chat table, the WebSocket API with its authorizer and routes, the
  Lambda registrations and IAM policies, plus the two EventBridge pipes in
  ``iac/terraform/aws/eventbridge/``.

Delivery and limits
~~~~~~~~~~~~~~~~~~~~

- **WebSocket first, push fallback.** Messages are delivered with
  ``ApiGatewayManagementApi``; a ``410 Gone`` response prunes the stale
  connection. Offline recipients receive a push via the existing notification
  queue.
- **Rate limiting.** Senders are limited to 60 messages per minute using a
  durable per-minute counter (atomic ``ADD`` with TTL) so the limit holds
  across concurrent Lambda containers.
- **Authorization.** History and inbox reads use the Cognito
  ``custom:userId`` claim; history additionally enforces channel membership.
