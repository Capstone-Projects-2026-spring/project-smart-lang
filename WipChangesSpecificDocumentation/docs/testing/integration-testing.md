---
sidebar_position: 2
---

# Integration tests

Integration tests validate behavior across module boundaries, especially where state, storage, and service adapters interact.

## Scope

- Login/session flow with Firebase Google OAuth adapter
- Board loading and persistence with Firestore-backed services
- Speech pipeline from sentence builder to selected speech provider
- Service worker and cached asset behavior under offline conditions

## Guidelines

- Validate end-to-end use-case slices from `use-case-descriptions.md`.
- Use controlled fixtures for boards, metadata, and prediction data.
- Stub external services when verifying client integration logic.
- Keep test output machine-verifiable and avoid manual interpretation in CI.

## Priority Scenarios

- Sign in, sync metadata, and load user board
- Build sentence, update prediction context, and trigger speech output
- Execute an HTTP action and surface response to live elements
