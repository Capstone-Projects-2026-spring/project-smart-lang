---
sidebar_position: 1
description: API design scope and implementation status for Smart Lang AAC.
---

# API Design Overview

This section documents the integration-facing behavior of Smart Lang AAC. It covers the current client-side interfaces and the HTTP endpoints defined for synchronization and service integration.

## Current Implementation

The running application is primarily client-side and includes these implemented integration layers:

- Local persistence with PouchDB
- Optional cloud sync flow via `superlogin-client` + CouchDB
- Speech providers: browser SpeechSynthesis, ResponsiveVoice, and a configurable external speech endpoint wrapper
- HTTP action service for grid-triggered API requests

## OpenAPI Scope

The OpenAPI document describes the API surface used by or planned for Smart Lang AAC services. Some endpoints are marked as planned and are included to align architecture, implementation roadmap, and team communication.

When reading the API docs:

- Treat endpoints marked planned as roadmap items, not deployed guarantees.
- Treat unmarked endpoints as currently supported by the documented design.

## Design Principles

- Keep the client usable in offline mode whenever possible.
- Keep external integrations optional and configurable.
- Keep API contracts explicit so UI and service layers can evolve independently.
