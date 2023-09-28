# PR Creation and Review Guideline

## PR Creation
- Follow the template and fill in the sections that are applicable in the template. *Do not ignore* any of the sections, provide as much information as possible.
- Go through the checklist near the bottom of the template and make sure that every item in the checklist is covered. Check the box only if you are certain that the checklist can be checked.
- Test coverage is crucial for the project. Please make sure that the test coverage guideline in the [coding standard](./CodingGuideline.md) document is followed.
- Make sure that all the existing tests (unit, integration, end-to-end) in the test suit passes.
- Individual commits must be buildable. They may be incomplete in terms of feature implementation, but they should not result in build errors.
- Meaningful commit messages are *mandatory*. The commit message should adhere to the [commit message template](https://github.com/CraftsmenLtd/BloodConnect/issues/8).
- Smaller PRs are preferred over large PRs. In case large PR is required, successive PRs to be merged on the main implementation branch can be created, with mentions in the [dependency section](https://github.com/CraftsmenLtd/BloodConnect/blame/f0fc0c12aa41f74ee25d6499c1f73a9a96b867c6/.github/pull_request_template.md#L8) of the `PR template`.
- Git hooks are configured with commits. Make sure that the hooks folder is provided in the Git config, and is executed on every commit. Guideline to set `git hook` directory can be found in [README](../../README.md).


## PR Review
- Ensure that **all the points** of the [coding standard](./CodingGuideline.md) are followed.
- Manually test every PR according to guidance provided in the PR description. Have edge cases in mind while testing, test as many different scenario as possible.
- Have an eye for security breaches in the code, and address them as necessary.
- Assess the deployment risk, make adjustments and provide comments where applicable.

## PR Merge
Merging PR access is limited to the maintainers for the time being. Default merging strategy is `merge`, and not `squash-merge`.