============
Donor Search
============

The donor search workflow finds eligible donors near a blood request and
sends them notifications in waves. It keeps going until enough donors
accept or the retry budget runs out.

EventBridge Scheduler triggers the ``donorSearch`` lambda one wave at a
time. Locations are indexed on a hexagonal grid using Uber H3 (``h3-js``).

High-level flow
~~~~~~~~~~~~~~~

1. **A donation request is created or updated** in DynamoDB.
2. **DynamoDB Stream → EventBridge Pipe** sends the change (``PK``, ``SK``,
   ``h3Res5``, ``h3Res8``, ``status``, ``eventName``) to the
   ``donationRequestInitiator`` lambda.
3. **The initiator** writes a ``DonorSearch`` record and submits the first
   ``DonorSearchSchedulerAttributes`` payload to EventBridge Scheduler.
4. **The scheduler runs** the ``donorSearch`` lambda after
   ``initialWaveDelaySeconds``.
5. **The wave loop** repeats: the lambda walks one batch of H3 ring cells,
   notifies any eligible donors, and then either schedules the next wave
   or stops.

Components
~~~~~~~~~~

``core/services/aws/donorSearch/donationRequestInitiator.ts``
    Runs when the EventBridge Pipe delivers a change. Reads the pipe event
    into ``DonationRequestInitiatorAttributes`` (including
    ``centerHex = h3Res8``) and calls
    ``DonorSearchService.initiateDonorSearchRequest``. Retries on
    transient errors with exponential backoff, up to
    ``donorSearchMaxInitiatingRetryCount`` attempts.

``core/services/aws/donorSearch/donorSearch.ts``
    Runs when EventBridge Scheduler fires, receiving a
    ``DonorSearchSchedulerAttributes`` payload. Plugs in the AWS adapters
    (DDB, SQS, H3 query repo) and calls ``DonorSearchService.searchDonors``
    to run one wave.

``core/application/bloodDonationWorkflow/DonorSearchService.ts``
    The application-layer service. Tracks waves, decides on retries, and
    skips donors that were already notified. Has no AWS imports.

``core/application/bloodDonationWorkflow/H3SearchService.ts``
    Builds the next batch of H3 ring cells (``buildRingBatch``) and looks
    up donors in those cells from the H3-indexed location GSI
    (``queryDonorsInHex``).

``core/application/utils/h3.ts``
    A thin wrapper around ``h3-js``: ``generateH3Cell``, ``getH3GridRing``,
    ``getH3GridDisk``, ``haversineKm``, ``getDistanceBetweenH3Cells``.

``core/application/utils/calculateDonorsToNotify.ts``
    Pure helpers that decide how many donors a wave should aim for and how
    long to wait between retries (see below).

Spatial model
~~~~~~~~~~~~~

Three H3 resolutions are used (constants in
``commons/libs/constants/NoMagicNumbers.ts``):

- ``H3_PUBLIC_FEED_RESOLUTION = 5`` (edge ~8.5 km, area ~252.9 km²) —
  partition key for the request GSI that backs the public nearby-posts
  feed.
- ``H3_DONOR_SEARCH_RESOLUTION = 8`` (edge ~461 m, area ~0.74 km²) —
  partition key for the location GSI used by the donor search ring walk.
- ``H3_FINE_RESOLUTION = 10`` (edge ~66 m, area ~15,047 m²) — a
  fine-grained cell stored on each user location row, used to rank donors
  by distance.

A wave starts at the request's ``h3Res8`` cell (the ``centerHex``) and
expands outward one ring at a time (``getH3GridRing`` with ``k = 1``,
then ``k = 2``, and so on). It stops when it hits the cell budget
(``maxCellsPerExecution``), reaches the max search radius
(``maxSearchRadiusKm``), or finds enough donors.

State persisted in DynamoDB
~~~~~~~~~~~~~~~~~~~~~~~~~~~

``DonorSearchDTO`` (see ``core/services/aws/commons/ddbModels``) holds:

- ``status`` — ``PENDING`` or ``COMPLETED``.
- ``notifiedEligibleDonors`` — a map of every donor notified across all
  waves so far, keyed by ``userId``.
- ``createdAt`` — original creation timestamp, used as part of the
  composite key.

Per-wave state (``currentLevel``, ``remainingCells``, ``retryCount``,
``remainingDonorsToFind``, ``targetedExecutionTime``) is not stored in
DynamoDB. It is passed from one wave to the next on the
``DonorSearchSchedulerAttributes`` payload.

``searchDonors`` per-wave logic
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Each scheduled invocation does the following:

1. **Stop if needed.** Skip the wave if the donation request is
   ``COMPLETED`` or ``CANCELLED`` or the search record was deleted.
2. **Work out how many donors to find.** Subtract donors who already
   accepted from the requested bag count. If none are needed, stop.
   Otherwise compute ``totalDonorsToFind`` with
   ``calculateTotalDonorsToFind``, or carry over the previous wave's
   ``remainingDonorsToFind`` plus however many donors have ignored the
   request so far.
3. **Build the ring batch.** ``H3SearchService.buildRingBatch`` keeps
   adding rings around ``centerHex``, starting just past ``currentLevel``,
   until it reaches ``maxCellsPerExecution`` or hits the max ring level
   derived from ``maxSearchRadiusKm``.
4. **Query donors in parallel.** Cells are queried in chunks of
   ``parallelQueryConcurrency`` against the location GSI, filtered by
   blood group and country. Results are deduplicated and any donors who
   are the seeker or who were already notified are removed.
5. **Notify them.** Eligible donors are pushed to the notification SQS
   queue and added to ``notifiedEligibleDonors`` on the search record.
6. **Pick what to do next.**

   - If more donors are still needed *and* there are unprocessed cells
     left in the ring batch, schedule the next wave right away with the
     updated ``currentLevel`` and ``remainingCells``.
   - Otherwise, if no donors were found in this wave and ``retryCount``
     is below ``maxRetries``, schedule a delayed retry from level 0 with
     ``retryCount + 1``.
   - Otherwise, mark the search ``COMPLETED``.

Calculation helpers (``calculateDonorsToNotify.ts``)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``calculateRemainingBagsNeeded(bloodQuantity, donorsFoundCount)``
    Returns ``max(0, bloodQuantity - donorsFoundCount)``.

``calculateTotalDonorsToFind(remainingBagsNeeded, urgencyLevel)``
    Asks for a few extra donors so the request can survive some declines:
    ``2`` extra for ``urgent`` requests, ``1`` for ``regular``. Returns
    ``0`` when no bags are still needed.

``calculateDelayPeriod(donationDateTime, maxRetries, retryDelaySeconds, acceptanceWindowSeconds)``
    Spaces retries evenly across the time left until donation:
    ``(timeUntilDonation / maxRetries) - retryDelaySeconds``, but never
    shorter than ``acceptanceWindowSeconds``.

Tunables
~~~~~~~~

These come from ``DonorSearchConfig`` (loaded from environment variables
in ``commons/libs/config/config.ts``):

Current values come from ``iac/terraform/aws/donor_search/local.tf`` and
are passed in as Lambda environment variables.

========================================  =======  =======================================================
Tunable                                   Value    Purpose
========================================  =======  =======================================================
``maxCellsPerExecution``                  500      Most H3 cells one wave is allowed to walk.
``parallelQueryConcurrency``              25       How many cells one wave queries at the same time.
``searchIntervalSeconds``                 180      Delay between back-to-back waves of the same run.
``initialWaveDelaySeconds``               0        Delay before the first wave runs.
``retryDelaySeconds``                     300      Smallest gap allowed between retry waves.
``maxRetries``                            3        How many retries when a wave finds no donors.
``acceptanceWindowSeconds``               3600     Smallest gap between retries, so donors have time
                                                   to respond.
``maxSearchRadiusKm``                     15       Hard cap on how far from the request the search may
                                                   walk, in kilometres.
``donorSearchMaxInitiatingRetryCount``    5        Retries allowed on transient errors at init time.
========================================  =======  =======================================================

Time-based tunables are in seconds.

What the numbers mean in practice
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The values above lead to the following behaviour:

**Cells per ring (H3 res 8)**
    Ring ``k`` around the center contains ``6k`` cells (and ``k = 0`` is
    the center itself, 1 cell). The disk up to ring ``k`` contains
    ``1 + 3k(k + 1)`` cells.

**Rings covered in one wave**
    With ``maxCellsPerExecution = 500``, one wave walks the largest disk
    that still fits in the budget:

    - Disk through ring ``12``: ``1 + 3 · 12 · 13 = 469`` cells ✔
    - Disk through ring ``13``: ``1 + 3 · 13 · 14 = 547`` cells ✘

    So wave 1 sweeps rings ``0``–``12``. If more donors are still needed,
    the next back-to-back wave continues from ring ``13`` and fits about
    five more rings (rings ``13``–``17`` add ``78 + 84 + 90 + 96 + 102 =
    450`` cells), and so on.

**Ground radius covered**
    Adjacent H3 res-8 cells are ``edge × √3 ≈ 461 m × 1.732 ≈ 798 m``
    apart center-to-center. So:

    - Wave 1 (ring 12) reaches ``≈ 12 × 0.798 km ≈ 9.6 km``.
    - Wave 2 (ring 17) reaches ``≈ 13.6 km``.

**Max search distance**
    ``maxSearchRadiusKm = 15`` is converted to a max ring level by
    rounding *up* so the configured radius is fully covered:
    ``ceil(15 / 0.798) = 19``. After ring 19 the ring walk stops, even
    if more donors are still needed. Effective max reach:
    ``19 × 0.798 km ≈ 15.2 km`` from the request center (the last ring
    that crosses the 15 km cap).

    With the current cell budget, that disk is covered in three
    back-to-back waves:

    - Wave 1: rings 0–13 (500 cells processed, 47 leftover in ring 13).
    - Wave 2: rings 13–18 (500 cells processed, 27 leftover in ring 18).
    - Wave 3: leftover from ring 18 + ring 19 (141 cells, all processed)
      and the search ends.

**Parallel query batches per wave**
    ``469 cells / 25 = 19`` parallel batches against the location GSI in
    wave 1.

**Time between waves**

    - Back-to-back waves (donors still needed, cells left): scheduled
      ``searchIntervalSeconds = 180 s`` (3 min) apart.
    - Retry wave (a wave found zero donors): scheduled
      ``max(calculateDelayPeriod, acceptanceWindowSeconds) =
      max(computed, 3600 s)``. The floor is 1 hour.

**Total retry budget**
    ``maxRetries = 3`` retries × 1 hour minimum per retry =
    ``3 hours`` of retry waiting in the worst case before the search is
    marked ``COMPLETED``.

Restart behaviour
~~~~~~~~~~~~~~~~~

If a finished search is reopened — the request is edited back to
``PENDING`` after the search reached ``COMPLETED`` — the initiator sees
``eventName = MODIFY`` plus ``status = PENDING`` on the EventBridge Pipe
event and schedules a fresh wave from level 0. Any donors already in
``notifiedEligibleDonors`` are kept on the record.

Related
~~~~~~~

- ``docs/architecture/Database.rst`` — the DynamoDB single-table layout,
  including the H3-keyed GSIs.
- ``docs/development/MobileAppDevelopment.rst`` — how the mobile app
  consumes the public nearby-posts API that shares the H3 index.
