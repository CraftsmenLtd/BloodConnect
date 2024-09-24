============
Git Workflow
============
We decided to use `Git` as version control system. For development, we have decided on the following process to introduce changes to our codebase and maintain deployments versions.

Main Branch
~~~~~~~~~~~
**master** is considered as the `main` branch of our repo. All PRs should ideally be merged to master. It will contain all the latest development, which will be available in our `stage` deployment stack. No changes/commits can be pushed to master directly, and will have to go through reviews via PRs.

Branch Naming Convention
~~~~~~~~~~~~~~~~~~~~~~~~
In case of working in a branch that will eventually end up as a PR, the branch name **must** contain a reference to the github issue number that it is implementing. The naming convention would be `I<issue_number>-<text reflecting the changes>`.

For example, the github issue number of the requirement to add this page to our documentation site is 47. Following the above guideline, the branch that implements this change is named `I47-branch-mgt-doc`.

Commits
~~~~~~~
- Individual commits must be buildable. They may be incomplete in terms of feature implementation, but they should not result in build errors.
- Meaningful commit messages are **mandatory**. It may contain a title, with more details separated by blank line in the commit message if needed. It must contain a reference to the issue number it is implementing, in the format `I-#<issue_number> <commit_message>`. Commit message format is enforced by `git hooks`, that is contained in the directory `.githooks`. This `issue <https://github.com/CraftsmenLtd/BloodConnect/issues/8>`_ introduces the commit message template.

Workflow
~~~~~~~~
All code changes introduced to `master` will be through `Pull Requests` aka `PR`. Once a PR is created, it needs to be **reviewed** and **approved** before being merged to the base branch. All branches will eventually merge to the main branch, `master` in our case.


PR Creation
***********
- Follow the template and fill in the sections that are applicable in the template. *Do not ignore* any of the sections, provide as much information as possible.
- Go through the checklist near the bottom of the template and make sure that every item in the checklist is covered. Check the box only if you are certain that the checklist can be checked.
- Test coverage is crucial for the project. Please make sure that the test coverage guideline in the :doc:`coding standard <./CodingGuideline>` document is followed.
- Make sure that all the existing tests (unit, integration, end-to-end) in the test suit passes.
- Smaller PRs are preferred over large PRs. In case large PR is required, successive PRs to be merged on the main implementation branch can be created, with mentions in the `dependency section <https://github.com/CraftsmenLtd/BloodConnect/blame/f0fc0c12aa41f74ee25d6499c1f73a9a96b867c6/.github/pull_request_template.md#L8>`_ of the `PR template`.
- Git hooks are configured with commits. Make sure that the hooks folder is provided in the Git config, and is executed on every commit. Guideline to set `git hook` directory can be found in project's README.md


PR Review
*********
- Ensure that **all the points** of the :doc:`coding standard <./CodingGuideline>` are followed.
- Manually test every PR according to guidance provided in the PR description. Have edge cases in mind while testing, test as many different scenario as possible.
- Have an eye for security breaches in the code, and address them as necessary.
- Assess the deployment risk, make adjustments and provide comments where applicable.

PR Merge
********
Merging PR access is limited to the maintainers for the time being. Default merging strategy is `merge`, and not `squash-merge`.

Branch Lifecycle
~~~~~~~~~~~~~~~~
- As the PR branches are primarily intended to be merged to `master`, the feature branch should ideally be taken from the latest commit of `master` branch. That is where the branch starts in journey.
- Once a PR is reviewed and merged, the branch should be deleted from github. It can be done from the PR page of github, or through git command. 

Release Management
~~~~~~~~~~~~~~~~~~
By default latest from `master` is deployed to `staging` stack. For releasing a version to production, we have decided to use `git tag`. Attaching a git tag to any commit in master should trigger a deploy from that commit to production. We have decided on using `semantic versioning`, hence the git tags should follow the semantic versioning guidelines.

.. graphviz:: ../assets/dot/git-workflow.dot
   :align: left
   :alt: Git Workflow