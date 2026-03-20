---
sidebar_position: 1
---

# Unit tests

Unit tests validate isolated logic without requiring full application startup.

## Scope

- Data model behavior in `src/js/model/`
- Service-level pure logic, especially prediction and formatting helpers
- Utility modules used by rendering and actions

## Guidelines

- Cover normal inputs, edge cases, and invalid inputs.
- Mock browser-only dependencies (`window`, `localStorage`, speech APIs).
- Keep unit tests deterministic and independent of network state.

## Priority Examples

- N-gram update and next-word ranking behavior
- Serialization/parsing of grid model objects
- Action payload generation for HTTP actions

Each test case should document inputs, expected outputs, and the reason the behavior matters for AAC usage.
