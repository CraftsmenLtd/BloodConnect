==========================
Donor Search Step Function
==========================

The donor search step function orchestrates the process of identifying potential donors for a blood donation request. It leverages AWS Step Functions to manage the workflow and DynamoDB for querying donor data.


State Machine Definition
~~~~~~~~~~~~~~~~~~~~~~~~

The Step Function is defined in the `donor_search.json` file and consists of the following key states:

Start State: PrepareDonorSearch
*******************************
Initiates the donor search prepare process.

- **State: QueryDonorsFound**: This step gets the list of donors accepted for this donation post.

- **State: PerformCalculations**: This step runs a calculation to determine the number of donors to notify, factoring in the urgency level, the amount of blood needed, and the timing of the donation. This calculation helps prioritize and limit notifications to only the necessary number of donors.


State: DonorSearchProcess
*************************
Serves as a placeholder to transition to the next state, maintaining the output for notification.

State: NotifyDonors
*******************************
This state represents the logic for notifying the donors based on the calculations, although the actual notification logic is not implemented in this state.


Calculation Logic: `calculateDonorsToNotify`
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The `calculateDonorsToNotify.ts` contains the logic for calculating the number of donors to notify based on the donor search results.

- **Calculate Total Donors To Notify**: Multiplies the remaining bags needed by the urgency level(urgent=2, regular=1) and a constant multiplier to determine how many donors should be notified. example `Urgency level` * `number of remaining bags` * `constant multiplier` = 3 * 2 * 2 = 12. We might need to rethink the constant multiplier.

- **calculateDelayPeriod**: Computes the delay period based on urgency level and days until the donation. It clamps the delay period between predefined minimum and maximum values.
