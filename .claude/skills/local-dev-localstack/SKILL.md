---
name: local-dev-localstack
description: Runs the full BloodConnect backend locally on LocalStack inside a Docker dev container, applying the Terraform stack with tflocal. Use when asked to "run the backend locally", "start LocalStack", "spin up the local stack", "deploy to localstack", "test against a local AWS", or set up the dev environment. Covers make start-dev / run-dev / localstack-start and the dev-container run-command-% pattern. Excludes real-environment (dev/stage/prod) deploys, which run via GitHub Actions.
---

# Local development on LocalStack

The backend runs against LocalStack (`localstack/localstack-pro`) and all `make` targets execute inside a Docker dev container (`Dockerfile` → image `dev-image`). Terraform runs with `tflocal` against `deployment/localstack/terraform` whenever `DEPLOYMENT_ENVIRONMENT_GROUP=localstack` (the default). Reference: `docs/devops/DockerizedDev.rst`.

## One-shot start

```
make start-dev
```
This chains (from the root `Makefile`):
1. `build-runner-image` — builds the `dev-image` Docker image with your host UID/GID.
2. `localstack-start` — runs the LocalStack Pro container `bloodconnect-dev-localstack` on `:4566` (needs `LOCALSTACK_AUTH_TOKEN`).
3. `run-command-install-node-packages` — `npm ci` inside the container.
4. `run-dev` → `run-command-build-node-all` → `run-command-tf-init` → `run-command-tf-plan-apply` → `run-command-tf-apply`.

The `run-command-%` target runs any make target inside the dev container on `--network host` with the repo mounted at `/app`, e.g. `make run-command-test`, `make run-command-tf-plan-apply`.

## Prerequisites

- Docker running.
- Copy `.devcontainer/.env.example` to `.devcontainer/.env`. The root `Makefile` auto-includes it. Set `LOCALSTACK_AUTH_TOKEN` (LocalStack Pro), and the dummy `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_SESSION_TOKEN` / `EXPO_TOKEN` placeholders are fine for LocalStack.
- `DEPLOYMENT_ENVIRONMENT_GROUP` defaults to `localstack`; `DEPLOYMENT_ENVIRONMENT` defaults to the current git branch (lowercased).

## Iterating

- Rebuild + redeploy Lambdas after code changes: `make run-dev` (or just `make run-command-build-node-all` then `make run-command-tf-apply`).
- Run tests in-container: `make run-command-test NPM_TEST_ARGS=...`.
- Restart LocalStack fresh: `make localstack-start` (force-removes and recreates the container).
- Generate mobile env from local TF outputs: `make prepare-mobile-env` (writes `clients/mobile/.env` from `tf-output-*`).

## Terraform routing

`Makefile` picks the runner/dir by `DEPLOYMENT_ENVIRONMENT_GROUP`:
- `localstack` → `TF_RUNNER=tflocal`, `TF_DIR=deployment/localstack/terraform`.
- anything else → `TF_RUNNER=terraform`, `TF_DIR=deployment/aws/terraform`.
The actual AWS resource modules live in `iac/terraform/aws/` and are referenced by both deployment dirs.

## Gotchas

- Always go through `run-command-%`/`start-dev`; running `terraform`/`tflocal` on the host bypasses the pinned toolchain in `dev-image`.
- LocalStack Pro auth is required — without a valid `LOCALSTACK_AUTH_TOKEN` the container won't start.
- `make deploy-dev-branch` / `destroy-dev-branch` target a *real* `dev` AWS environment (`DEPLOYMENT_ENVIRONMENT_GROUP=dev`), not LocalStack — don't use them for local work.
- Real env deploys (dev/stage/prod) are GitHub Actions (`.github/workflows/deploy-branch.yml`, `deploy-stage.yml`, `deploy-prod.yml`), not local make targets.
- Quality gate before pushing: `make lint` and `make test`.
