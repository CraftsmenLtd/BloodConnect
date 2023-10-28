================
Ticket Lifecycle
================
Tickets, cards or Issues (as referred to in GitHub) go through several steps to be considered as complete or done. Issues can be of type `epic/story` (managed with `label` in GitHub), or a task. Issues with label `epic/story` do no have a lifecycle, but are kept as reference to contextualize the tasks.

Epic/User Story
~~~~~~~~~~~~~~~
These are the basis for defining the tasks. In other words, *actionable items* or tasks are extracted from these stories, and the stories contain a reference of each task extracted from it.

Backlog
~~~~~~~
All the actionable issues (tasks) are added to backlog. It contains everything that needs to be performed on the project, essential and non-essential, current and future.

Todo
~~~~~
Issues that needs to be worked on are added to the `Todo` list. Once it has been added to the list, it is ready to be picked up and worked on. 

In Progress
~~~~~~~~~~~
Once the issue has been picked up by someone and is being worked on, it is moved to the `In Progress` list.

Ready for Review
~~~~~~~~~~~~~~~~
Once the changes have been finalized and a review is requested on a `Pull Request <https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests>`_, it is moved to the `Ready for Review` list.

Reviewing
~~~~~~~~~
Once the PR associated with the issue is being reviewed by the reviewer, it is moved to the `Reviewing` list. If changes are requested on the PR, the issue moves back to `In Progress`_. list.

Ready to Merge
~~~~~~~~~~~~~~
Once a PR has been approved by the reviewer, the issue is moved to `Ready to Merge` list.

Done/Merged
~~~~~~~~~~~
When a PR has been merged by the *Maintainer*, the issue is moved to `Done/Merged` list. Once the issue reaches this list, the lifecycle is complete. It may be `Archived` after certain number of days.

Closed
~~~~~~
An issue can end up in this list due one of the following reasons:

- If a PR cannot be created, and will not be created for the issue. It can be both business or technical call. 
- PR related to the issue will not be merged for technical reasons.
- The issue will not be worked on, maybe due to being duplicate, or having another issue replace this issue. 

A comment containing reference to relevant issues and links is expected in the issues that end up in this list. These issues may be `Archived` after certain number of days.

.. graphviz:: ../dot/ticket-workflow.dot
   :align: left
   :alt: Ticket Workflow