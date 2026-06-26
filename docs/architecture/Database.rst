=====================
BloodConnect Database
=====================

BloodConnect stores its operational data in a **single Amazon DynamoDB table**.
Every entity — users, donor locations, blood requests, donor-search orchestration
state, donation records and notifications — lives in this one table and is
distinguished by prefixed partition and sort keys (single-table design).

This document describes the **as-built** schema: the key shapes, access patterns
and indexes that the application code actually reads and writes.

.. contents::
   :local:
   :depth: 2

Physical table configuration
============================

Source of truth: ``iac/terraform/aws/dynamodb/dynamodb.tf``.

.. list-table::
   :header-rows: 1
   :widths: 30 70

   * - Setting
     - Value
   * - Billing mode
     - ``PAY_PER_REQUEST`` (on-demand)
   * - Primary key
     - ``PK`` (partition) + ``SK`` (sort)
   * - Streams
     - Enabled, ``NEW_AND_OLD_IMAGES``
   * - Local secondary index
     - ``LSI1`` — range key ``LSI1SK``, projection ``ALL``
   * - Global secondary index
     - ``GSI1`` — partition ``GSI1PK`` + sort ``GSI1SK``, projection ``ALL``

The five indexed attributes (``PK``, ``SK``, ``LSI1SK``, ``GSI1PK``, ``GSI1SK``)
are all strings. ``LSI1`` and ``GSI1`` are **overloaded**: their meaning depends
on which entity wrote the item, so a single index serves multiple access
patterns.

Design conventions
==================

- **Single-table design.** All entities share one table; the key prefix
  (``USER#``, ``BLOOD_REQ#``, ``DONOR_SEARCH#``, ``DONATION#``, ``NOTIFICATION#``)
  identifies the entity type.
- **Key overloading.** ``GSI1PK``/``GSI1SK`` and ``LSI1SK`` carry different
  composite values per entity. Items only join an index when they populate the
  relevant key attributes; otherwise they are invisible to that index.
- **``#`` delimiter.** Composite keys join segments with ``#`` (which sorts
  before alphanumerics, keeping prefixed items grouped).
- **ISO 8601 timestamps.** ``createdAt`` / ``updatedAt`` are stored as sortable
  UTC strings (``YYYY-MM-DDTHH:MM:SSZ``) so they work as sort-key segments.
- **DTO-backed attributes.** Item attributes are the fields of the matching DTO;
  the model's ``fromDto``/``toDto`` only rewrites the key attributes. Attribute
  lists below reference the DTO rather than duplicating every field, so the doc
  does not drift as DTOs evolve.

Entity catalogue
================

User profile
------------

Source: ``core/services/aws/commons/ddbModels/UserModel.ts`` · attributes:
``UserDetailsDTO`` (``commons/dto/UserDTO.ts``).

.. list-table::
   :header-rows: 1
   :widths: 18 82

   * - Key
     - Value
   * - ``PK``
     - ``USER#<userId>``
   * - ``SK``
     - ``PROFILE``

Access patterns

- **Get / update a user by id** — primary key lookup on ``PK = USER#<userId>``,
  ``SK = PROFILE``.

The user profile item is not projected onto any secondary index.

Donor location (donor-search index)
-----------------------------------

Source: ``core/services/aws/commons/ddbModels/LocationModel.ts`` · attributes:
``LocationDTO`` (``commons/dto/UserDTO.ts``).

A user may have multiple preferred locations; each is a separate item under the
same user partition. This item carries the **geospatial donor-search index**.

.. list-table::
   :header-rows: 1
   :widths: 18 82

   * - Key
     - Value
   * - ``PK``
     - ``USER#<userId>``
   * - ``SK``
     - ``LOCATION#<locationId>``
   * - ``GSI1PK``
     - ``LOC#<countryCode>#<bloodGroup>#<AVAIL|UNAVAIL>#<h3Res8>``
   * - ``GSI1SK``
     - ``USER#<userId>``

Access patterns

- **List a user's locations** — query ``PK = USER#<userId>``,
  ``SK begins_with LOCATION#``.
- **Find available donors near a point, by blood group** — query ``GSI1`` with
  ``GSI1PK = LOC#<countryCode>#<bloodGroup>#AVAIL#<h3Res8 cell>``
  (``H3SearchDynamoDbOperations.queryDonorsInHex``). The donor-search workflow
  resolves the request location to its H3 resolution-8 cell, queries that cell,
  then walks outward rings of neighbouring res-8 cells for wider waves.

``h3Res8`` is the partition cell; ``h3Res10`` and ``latitude``/``longitude`` are
stored on the row for fine distance refinement. The search read path also
projects ``displayName`` and ``phoneE164``.

.. note::

   ``displayName`` and ``phoneE164`` are read by the search path but are **not
   currently written** by ``LocationService.updateUserLocation`` — a known gap;
   donor name/phone are sourced elsewhere until this is resolved.

Blood request post
------------------

Source: ``core/services/aws/commons/ddbModels/BloodDonationModel.ts`` ·
attributes: ``DonationDTO`` (``commons/dto/DonationDTO.ts``).

.. list-table::
   :header-rows: 1
   :widths: 18 82

   * - Key
     - Value
   * - ``PK``
     - ``BLOOD_REQ#<seekerId>``
   * - ``SK``
     - ``BLOOD_REQ#<createdAt>#<requestPostId>``
   * - ``GSI1PK`` *(conditional)*
     - ``REQ#<countryCode>#<requestedBloodGroup>#<status>#<h3Res5>``
   * - ``GSI1SK`` *(conditional)*
     - ``<createdAt>``
   * - ``LSI1SK`` *(conditional)*
     - ``STATUS#<status>#<requestPostId>``

Access patterns

- **Get one request** — exact primary-key lookup on ``PK = BLOOD_REQ#<seekerId>``,
  ``SK = BLOOD_REQ#<createdAt>#<requestPostId>`` (``getDonationRequest``).
- **List a seeker's requests by creation date** — query
  ``PK = BLOOD_REQ#<seekerId>``, ``SK begins_with BLOOD_REQ#<createdAt-prefix>``
  (``getDonationRequestsByDate``).
- **Find nearby pending requests (public feed), by blood group** — query
  ``GSI1`` with ``GSI1PK = REQ#<countryCode>#<bloodGroup>#PENDING#<h3Res5 cell>``,
  sorted by ``GSI1SK`` (``createdAt``)
  (``NearbyBloodRequestsDynamoDbOperations.queryBloodRequestsInHex``).

``GSI1PK``/``GSI1SK`` and ``LSI1SK`` are only written when the corresponding
fields (``status``, ``countryCode``, ``requestedBloodGroup``, ``h3Res5``) are
present. The GSI is *written* for **all** statuses, but the only read above pins
``PENDING``. ``LSI1SK`` is written but not read by any current query (see the
LSI1 note under `Overloaded index summary`_).

Accepted donation
-----------------

Source: ``core/services/aws/commons/ddbModels/AcceptDonationModel.ts`` ·
attributes: ``AcceptDonationDTO`` (``commons/dto/DonationDTO.ts``).

Records a donor accepting a specific request. It shares the request's partition
(``BLOOD_REQ#<seekerId>``) so acceptances co-locate with the request post.

.. list-table::
   :header-rows: 1
   :widths: 18 82

   * - Key
     - Value
   * - ``PK``
     - ``BLOOD_REQ#<seekerId>``
   * - ``SK``
     - ``ACCEPTED#<requestPostId>#<donorId>``

Access patterns

- **Get one donor's acceptance** — exact lookup ``PK = BLOOD_REQ#<seekerId>``,
  ``SK = ACCEPTED#<requestPostId>#<donorId>`` (``getAcceptedRequest``).
- **List donors who accepted a request** — query ``PK = BLOOD_REQ#<seekerId>``,
  ``SK begins_with ACCEPTED#<requestPostId>`` (``queryAcceptedRequests``).

Donor-search orchestration state
--------------------------------

Source: ``core/services/aws/commons/ddbModels/DonorSearchModel.ts`` ·
attributes: ``DonorSearchDTO`` (``commons/dto/DonationDTO.ts``).

Tracks the state of the wave-based donor-search process for a request
(current level, retry count, notified donors, wave history).

.. list-table::
   :header-rows: 1
   :widths: 18 82

   * - Key
     - Value
   * - ``PK``
     - ``DONOR_SEARCH#<seekerId>``
   * - ``SK``
     - ``DONOR_SEARCH#<createdAt>#<requestPostId>``
   * - ``LSI1SK`` *(conditional)*
     - ``STATUS#<status>#<requestPostId>``
   * - ``GSI1PK`` *(conditional)*
     - ``DONOR_SEARCH#<bucket>``
   * - ``GSI1SK`` *(conditional)*
     - ``<createdAt>``

``<bucket>`` is ``PENDING`` while the search is in progress, otherwise the
``completionReason`` (or terminal ``status``) — e.g. ``RADIUS_EXHAUSTED``,
``FOUND_ENOUGH``.

Access patterns

- **Get search state for a seeker's request** — exact primary-key lookup on
  ``PK = DONOR_SEARCH#<seekerId>``, ``SK = DONOR_SEARCH#<createdAt>#<requestPostId>``
  (``getDonorSearchItem``).
- **List searches by outcome bucket** — query ``GSI1`` with
  ``GSI1PK = DONOR_SEARCH#PENDING`` (in-flight / "stuck" searches) or
  ``GSI1PK = DONOR_SEARCH#RADIUS_EXHAUSTED`` (underserved), sorted by ``createdAt``.
  This read is performed by the **monitoring client** (``clients/monitoring``)
  querying DynamoDB directly; no backend handler uses it.

Donation record
---------------

Source: ``core/services/aws/commons/ddbModels/DonationRecordModel.ts`` ·
attributes: ``DonationRecordDTO`` (``commons/dto/DonationDTO.ts``).

.. list-table::
   :header-rows: 1
   :widths: 18 82

   * - Key
     - Value
   * - ``PK``
     - ``DONATION#<donorId>``
   * - ``SK``
     - ``DONATION#<requestPostId>``

Access patterns

- **Get a donor's donation history** — supported by the key design
  (``PK = DONATION#<donorId>``, ``SK begins_with DONATION#``), but
  ``DonationRecordDynamoDbOperations`` adds no entity-specific query yet — only
  base item CRUD (``create`` / ``getItem`` / ``update`` / ``delete``) is wired.

Notification
------------

Source: ``core/services/aws/commons/ddbModels/DonationNotificationModel.ts`` ·
operations: ``DonationNotificationDynamoDbOperations`` · attributes:
``DonationNotificationDTO`` / ``NotificationDTO`` (``commons/dto/NotificationDTO.ts``).

**All** notifications — blood-request, acceptance, ignore, and generic
``COMMON`` — are written through ``DonationNotificationModel`` as one item shape.
The secondary-index keys are populated only for the blood-related types.

.. list-table::
   :header-rows: 1
   :widths: 18 82

   * - Key
     - Value
   * - ``PK``
     - ``NOTIFICATION#<userId>``
   * - ``SK``
     - ``<type>#<id>``
   * - ``GSI1PK`` *(conditional)*
     - ``<requestPostId>`` (the notification ``id``)
   * - ``GSI1SK`` *(conditional)*
     - ``NOTIFICATION#<status>#<userId>``
   * - ``LSI1SK`` *(conditional)*
     - ``STATUS#<status>#<id>``

``<type>`` is a ``NotificationType`` (``BLOOD_REQ_POST``, ``REQ_ACCEPTED``,
``REQ_IGNORED``, ``COMMON``); ``<id>`` is the ``requestPostId`` for blood-related
types. ``GSI1`` keys are written only for ``BLOOD_REQ_POST``, ``REQ_ACCEPTED``
and ``REQ_IGNORED``; ``LSI1SK`` whenever ``status`` is set. Writes use a
conditional put (``attribute_not_exists(PK)``), so re-sends are idempotent.

Access patterns

- **Get a specific notification** — exact lookup ``PK = NOTIFICATION#<userId>``,
  ``SK = <type>#<requestPostId>`` (``getBloodDonationNotification``).
- **Find everyone notified for a request (optionally by status)** — query
  ``GSI1`` with ``GSI1PK = <requestPostId>``, optionally
  ``GSI1SK begins_with NOTIFICATION#<status>``
  (``queryBloodDonationNotifications``).

.. note::

   A second adapter, ``NotificationModel`` (same ``PK``/``SK`` shape, no index
   keys), is defined but **not currently wired to any operations class** — only
   its ``NOTIFICATION#`` prefix constant is reused. Listed for completeness.

Overloaded index summary
========================

Because ``GSI1`` and ``LSI1`` are shared, the same physical index serves several
entities. The table below summarises what each writes.

.. list-table:: GSI1 (partition ``GSI1PK`` / sort ``GSI1SK``)
   :header-rows: 1
   :widths: 28 44 28

   * - Entity
     - ``GSI1PK``
     - ``GSI1SK``
   * - Donor location
     - ``LOC#<country>#<bg>#<AVAIL|UNAVAIL>#<h3Res8>``
     - ``USER#<userId>``
   * - Blood request post
     - ``REQ#<country>#<bg>#<status>#<h3Res5>``
     - ``<createdAt>``
   * - Donor-search state
     - ``DONOR_SEARCH#<bucket>``
     - ``<createdAt>``
   * - Notification
     - ``<requestPostId>``
     - ``NOTIFICATION#<status>#<userId>``

.. note::

   **LSI1 is written but not currently read.** ``LSI1SK`` is populated by the
   three entities below, but no code path queries ``LSI1`` (nothing calls
   ``getIndex('LSI', ...)``). Status-scoped reads are served by ``GSI1`` instead.
   The LSI is effectively provisioned for future status-filtered lookups.

.. list-table:: LSI1 (sort ``LSI1SK``, partition = item ``PK``)
   :header-rows: 1
   :widths: 36 64

   * - Entity
     - ``LSI1SK``
   * - Blood request post
     - ``STATUS#<status>#<requestPostId>``
   * - Donor-search state
     - ``STATUS#<status>#<requestPostId>``
   * - Notification
     - ``STATUS#<status>#<id>``

Geospatial design (H3)
======================

Donor and request matching is geospatial, built on **Uber
`H3 <https://h3geo.org/>`_ hexagonal cells**, which give uniform-area neighbours
and a clean ring-walk for expanding the search radius.

Three H3 resolutions are used (``commons/libs/constants/NoMagicNumbers.ts``):

.. list-table::
   :header-rows: 1
   :widths: 20 18 62

   * - Constant
     - Resolution
     - Role
   * - ``H3_PUBLIC_FEED_RESOLUTION``
     - 5 (~8.54 km edge)
     - ``REQ`` GSI1 partition cell for the nearby-posts public feed
   * - ``H3_DONOR_SEARCH_RESOLUTION``
     - 8 (~0.461 km edge)
     - ``LOC`` GSI1 partition cell + outward ring walk for donor search
   * - ``H3_FINE_RESOLUTION``
     - 10
     - Stored on rows for fine distance refinement

Cells are derived with ``h3-js`` ``latLngToCell`` (see
``core/application/utils/h3.ts``). Search queries the GSI1 partition for the
centre cell, then expands by querying neighbouring cells obtained from
``gridRing`` (with a ``gridDiskDistances`` fallback near H3 pentagons), refining
final ordering by haversine distance using the stored fine-resolution
coordinates.

.. note::

   A row is only matched by the H3 search once it carries the H3 keys
   (``LOC#…#h3Res8``, ``REQ#…#h3Res5``) and the ``h3Res8`` / ``h3Res10``
   attributes; rows are backfilled per environment.

Chat table (dedicated)
======================

In-app chat is the one workflow that does **not** share the main table. It uses
a dedicated table, ``<env>-bloodConnect-chat-table``
(``iac/terraform/aws/dynamodb/dynamodb.tf``), to isolate its high write volume
and per-message TTL from core data. The table has a ``PK``/``SK`` primary key, a
single ``GSI1`` (``GSI1PK``/``GSI1SK``), a stream, and TTL on ``expiresAt``.

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
     - TTL (90 days)
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

Models live in ``core/services/aws/commons/ddbModels/`` (``ChatChannelModel``,
``ChatMessageModel``, ``ChatConnectionModel``, ``UserChannelModel``). See
:doc:`../development/Chat` for the workflow and access patterns. ``channelId`` is
a deterministic hash of ``(seekerId, requestPostId, donorId)``.

Status enumerations
===================

Reference for the ``<status>`` segments above (``commons/dto/DonationDTO.ts``,
``commons/dto/NotificationDTO.ts``):

- ``DonationStatus`` — ``PENDING``, ``COMPLETED``, ``CANCELLED``, ``MANAGED``,
  ``EXPIRED``.
- ``DonorSearchStatus`` — ``PENDING``, ``COMPLETED`` (with
  ``DonorSearchCompletionReason``: ``FOUND_ENOUGH``, ``DONORS_ACCEPTED``,
  ``REQUEST_CLOSED``, ``RADIUS_EXHAUSTED``).
- ``AcceptDonationStatus`` / ``NotificationStatus`` — ``PENDING``, ``ACCEPTED``,
  ``COMPLETED``, ``IGNORED``.
