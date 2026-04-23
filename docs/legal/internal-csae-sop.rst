:orphan:

.. WARNING: This document is INTERNAL ONLY.
   It is excluded from the public Sphinx build via conf.py exclude_patterns.
   Do NOT add it to any toctree or index.rst. Do NOT publish it to bloodconnect.net.

=========================================================
Internal CSAE/CSAM Incident Response SOP — BloodConnect
=========================================================

**Classification:** Internal — Confidential
**Owner:** Child Safety Compliance Lead
**Last reviewed:** 2026-04-23
**Next review:** 2026-07-23 (quarterly — see Section 7)

---

.. contents::
   :local:
   :depth: 1

---

Section 0: Child Safety Point of Contact (CSS-1)
=================================================

This section records the organisation's named child-safety point of contact as required by the
Google Play Child Safety Standards declaration.

- **Name:** Md Mahinuzzaman
- **Role:** Child Safety Compliance Lead, Craftsmen Ltd.
- **Public contact email:** support@bloodconnect.net
- **Backup contact:** Escalate to Craftsmen Ltd. engineering lead (see Section 6)

The point of contact is responsible for:

- Monitoring ``support@bloodconnect.net`` for incoming CSAE/CSAM reports.
- Executing this SOP when a credible report arrives.
- Maintaining and reviewing this document quarterly (Section 7).
- Serving as the named individual in the Play Console declaration and on the public
  Child Safety Standards page at ``https://bloodconnect.net/child-safety``.

---

Section 1: Intake — How Reports Reach Us
=========================================

Reports may arrive through any of the following channels:

1. **In-app report** — user taps "Report a safety concern" in the mobile app (Settings) or
   "Report" on a user profile / donation post card. Routes to ``support@bloodconnect.net``
   (interim mailto) or to the ``POST /safety/report`` endpoint once CSS-13–17 ship.

2. **Direct email** — sender writes to ``support@bloodconnect.net``.

3. **Google Play / Google notification** — Google contacts the registered point of contact
   email with a policy notice or escalation.

4. **NCMEC referral** — the National Center for Missing & Exploited Children (NCMEC) or a
   law enforcement agency contacts Craftsmen Ltd. directly.

5. **Other direct contact** — media, NGO, or other party raises a concern out-of-band.

All intake channels must be acknowledged within **24 hours** of receipt (Section 2).

---

Section 2: Triage (within 24 hours of receipt)
===============================================

Performed by: Child Safety Compliance Lead (Md Mahinuzzaman).

Steps:

1. **Acknowledge the reporter.** Reply to the incoming channel confirming receipt.
   Do not make commitments about outcome at this stage.

2. **Classify severity:**

   - **Severity 1 (Critical):** Credible CSAM (real, animated, or AI-generated imagery
     of a minor in a sexual context), or ongoing grooming / active exploitation.
     → Proceed immediately to Section 3. Notify Craftsmen Ltd. leadership same day.

   - **Severity 2 (High):** Suspected CSAE with incomplete evidence (e.g., suspicious
     messages, ambiguous imagery).
     → Preserve evidence, freeze account pending review, escalate within 24 h.

   - **Severity 3 (Other):** Harassment, fraud, or other policy violation unrelated to
     child safety.
     → Route to standard abuse queue; this SOP does not apply beyond intake.

3. **Decide on account freeze.** For Severity 1 or 2: disable the reported Cognito account
   (Section 3, step 1) before any further investigation or external disclosure.

4. **Document the intake.** Record in the internal tracker (Notion / private issue):
   date received, channel, reporter identifier (if any), severity classification, and
   assigned handler.

---

Section 3: Account Action and Evidence Preservation
=====================================================

Performed by: Child Safety Compliance Lead or designated engineer.

1. **Freeze the Cognito account.**

   Use the AWS CLI or AWS Console:

   .. code-block:: bash

      # Disable sign-in
      aws cognito-idp admin-disable-user \
        --user-pool-id <USER_POOL_ID> \
        --username <USERNAME_OR_EMAIL>

      # Revoke all refresh tokens (forces all sessions to expire)
      aws cognito-idp admin-user-global-sign-out \
        --user-pool-id <USER_POOL_ID> \
        --username <USERNAME_OR_EMAIL>

   Record the Cognito ``sub`` (userId) for all subsequent steps.

2. **Quarantine uploaded artifacts.**

   If the reported user uploaded any files (NID images or other S3-stored objects):

   - Identify the S3 keys associated with ``USER#{userId}`` in DynamoDB.
   - Copy the objects to a restricted quarantine prefix (e.g., ``s3://<bucket>/quarantine/<userId>/``).
   - Apply a restrictive bucket policy or ACL to the quarantine prefix so it is not publicly accessible.
   - Do NOT delete originals yet — they are evidence.

3. **Preserve DynamoDB records.**

   - Export the user's DynamoDB items (profile, donations, accepted records) via
     ``aws dynamodb get-item`` or ``ExportTableToPointInTime``.
   - Store the export in the quarantine S3 prefix alongside any S3 artifacts.

4. **Preserve CloudWatch / application logs.**

   - Set a manual log retention extension on the relevant log groups if the 60-day
     default retention may expire before legal resolution.
   - Export relevant log streams to S3 for long-term storage.

5. **Document all actions taken** (timestamps, AWS resource ARNs, who performed each step)
   in the internal tracker entry opened in Section 2.

---

Section 4: Reporting Obligations
==================================

**These obligations are mandatory, not optional.**

4.1 NCMEC CyberTipline (U.S.)
------------------------------

Required under 18 U.S.C. § 2258A for electronic service providers that obtain actual
knowledge of apparent CSAM and serve U.S. users.

- **URL:** https://report.cybertip.org/
- **When:** As soon as practicable after obtaining actual knowledge. Do not delay to complete
  internal investigation first.
- **What to include:** description of the content/conduct, user identifiers, IP address if
  available, timestamps, any preserved artifacts (upload via CyberTipline portal).
- **After submitting:** Record the CyberTipline **report ID** in the internal tracker. This ID
  is required if law enforcement later requests corroboration.
- **Do not disclose** the existence of a CyberTipline report to the reported user or any
  third party not involved in the response.

4.2 Bangladesh — Cyber Police Centre, CID
------------------------------------------

Applies when the matter involves a user located in Bangladesh (the primary deployment market)
or when Craftsmen Ltd. personnel or infrastructure in Bangladesh are involved.

- **Hotline:** +8801320010148
- **Email:** cyber@police.gov.bd
- **Agency:** Cyber Police Centre, Criminal Investigation Department (CID), Bangladesh Police.
- **What to report:** Same information as NCMEC; reference the CyberTipline report ID if
  already filed.
- **Record** the date/time of report, name of officer spoken to (if phone), and any reference
  number provided.

4.3 Other jurisdictions
------------------------

If the matter involves a user or victim in a jurisdiction other than the U.S. or Bangladesh,
escalate to Craftsmen Ltd. leadership (Section 6) to determine the applicable authority and
reporting deadline for that jurisdiction before filing.

---

Section 5: Post-Incident Actions
==================================

1. **Permanent ban.** After reporting obligations are met (Section 4), permanently disable
   the account (leave ``AdminDisableUser`` in place) and flag the userId in the application
   database to prevent re-registration with the same credentials.

2. **Block associated identifiers where feasible.**

   - Block the device token (SNS endpoint ARN) from receiving further notifications.
   - If the user registered via social login, document the provider + provider user ID so
     re-registration via the same social account can be detected.

3. **Content removal.** Remove any content (donation posts, profile data) created by the
   reported user from all public-facing surfaces of the app. Retain quarantined copies per
   step 3 in Section 3.

4. **Record retention.** Retain all preserved evidence (S3 exports, DynamoDB snapshots, logs,
   CyberTipline report ID, correspondence) for a minimum of **7 years** or the period required
   by applicable law, whichever is longer.

5. **Law enforcement cooperation.** If law enforcement (Bangladesh CID, NCMEC follow-up, or
   other agency) requests records, preserve and produce them via Craftsmen Ltd.'s legal
   representative. Do not produce records without legal review unless required by a valid
   court order.

6. **Close the internal tracker entry** only after:

   - Reporting obligations fulfilled (Section 4).
   - Account and content actions complete (steps 1–3 above).
   - Evidence preserved per retention policy (step 4).
   - Craftsmen Ltd. leadership notified and signed off.

---

Section 6: Escalation and On-Call
===================================

+---------------------------+-----------------------------------------------+
| Situation                 | Action                                        |
+===========================+===============================================+
| Child Safety Lead         | Escalate to Craftsmen Ltd. engineering lead   |
| unreachable               | (identify and document name here before       |
|                           | publishing this SOP).                         |
+---------------------------+-----------------------------------------------+
| Severity 1 report outside | Engineering lead notifies Craftsmen Ltd.      |
| business hours            | leadership immediately; do not wait for       |
|                           | next business day.                            |
+---------------------------+-----------------------------------------------+
| Law enforcement contact   | All responses go through Craftsmen Ltd.       |
| (police, court order)     | legal representative before disclosure.       |
+---------------------------+-----------------------------------------------+
| NCMEC follow-up or        | Treat as Severity 1; escalate same day.       |
| government agency inquiry |                                               |
+---------------------------+-----------------------------------------------+

**Backup contact (fill in before publishing):**

- Name: ________________________
- Role: ________________________
- Contact: ________________________

---

Section 7: Review Cadence
===========================

This SOP must be reviewed and updated at minimum **quarterly**. Reviews are tracked as part
of CSS-25 (Quarterly review cadence for published standards).

Review checklist:

- [ ] NCMEC CyberTipline URL still resolves and portal is functional.
- [ ] Bangladesh CID hotline (+8801730336431) and email (smmcpc2018@gmail.com) still active.
- [ ] ``support@bloodconnect.net`` alias still forwarding to the current POC's inbox.
- [ ] POC is still in role; update Section 0 and Play Console if changed.
- [ ] Any new reporting obligations in relevant jurisdictions identified and added to Section 4.
- [ ] Backup contact in Section 6 is current and reachable.
- [ ] SOP reviewed and signed off by Craftsmen Ltd. leadership.

**Scheduled review dates:**

- 2026-07-23
- 2026-10-23
- 2027-01-23
- (and quarterly thereafter)

---

References
==========

- `NCMEC CyberTipline <https://report.cybertip.org/>`_
- `18 U.S.C. § 2258A — Reporting requirements of providers <https://www.law.cornell.edu/uscode/text/18/2258A>`_
- `Bangladesh CID — Cyber Crime Complaint hotline <https://www.cid.gov.bd/hot-line-number-for-cyber-complain>`_
- `Technology Coalition — CSAM Identification and Reporting <https://technologycoalition.org/wp-content/uploads/CSAM-Identification_Reporting_R3-1.pdf>`_
- `Google Play Child Safety Standards policy <https://support.google.com/googleplay/android-developer/answer/14747720>`_
