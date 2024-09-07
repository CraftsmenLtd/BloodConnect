=====================
Git Branch Management
=====================

Main Branch
~~~~~~~~~~~
**master** is considered as the `main` branch of our repo. All PRs should ideally be merged to master. It will contain all the latest development, which will be available in our `stage` deployment stack. No changes/commits can be pushed to master directly, and will have to go through reviews via PRs.

Branch Naming Convention
~~~~~~~~~~~~~~~~~~~~~~~~
In case of working in a branch that will eventually end up as a PR, the branch name **must** contain a reference to the github issue number that it is implementing. The naming convention would be `I<issue_number>-<text reflecting the changes>`.

For example, the github issue number of the requirement to add this page to our documentation site is 47. Following the above guideline, the branch that implements this change is named `I47-branch-mgt-doc`.

Branch Lifecycle
~~~~~~~~~~~~~~~~
- As the PR branches are primarily intended to be merged to `master`, the feature branch should ideally be taken from the latest commit of `master` branch. That is where the branch starts in journey.
- Once a PR is reviewed and merged, the branch should be deleted from github. It can be done from the PR page of github, or through git command. 

Release Management
~~~~~~~~~~~~~~~~~~
By default latest from `master` is deployed to `staging` stack. For releasing a version to production, we have decided to use `git tag`. Attaching a git tag to any commit in master should trigger a deploy from that commit to production. We have decided on using `semantic versioning`, hence the git tags should follow the semantic versioning guidelines.