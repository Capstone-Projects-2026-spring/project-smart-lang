---
sidebar_position: 2
---

# System Block Diagram

![System Block Diagram](https://github.com/user-attachments/assets/ef4b926b-0c1f-4d13-bb26-ca631a3e9bb0)


**Figure 1** provides an overview of the grid-based AAC (Augmentative and Alternative Communication) application architecture.

## System Overview

Users interact with the system through tablets, desktop computers, or mobile devices using a web browser. The application is implemented as a Progressive Web App (PWA), enabling cross-platform access and offline functionality.

## Frontend Architecture

The frontend is built using **Vue 2.7** with **HTML5** and **JavaScript** and consists of two primary interfaces:

- **AAC Grid UI**
  Designed for communication users to select symbols and construct messages.

- **Caregiver Interface**
  Used for configuration, vocabulary management, and system personalization.

The frontend follows an **offline-first architecture** using:
- **PouchDB** (IndexedDB-backed) for local data storage
- **Service Workers** (via Workbox) for caching and offline access

This allows users to continue communicating even without an active internet connection.

## Communication Flow Components

Several core components work together to support message creation:

- **Word Selection Handler** – Processes symbol and word selections
- **Sentence Builder** – Constructs complete messages from selected words
- **Suggestion Engine** – Provides context-aware word predictions

Completed sentences are converted to speech using the **Web Speech API**, enabling real-time text-to-speech output.

## Logging and Analytics Components

The system tracks user interaction patterns locally:

- **UsageLog** – Records tile usage frequency and context for the client-side prediction engine

**Logging Flow:**
1. Events captured locally in **PouchDB** during all sessions
2. Data used by the client-side n-gram prediction engine to improve word suggestions
3. Optional synchronization to **CouchDB** when cloud sync is configured

## Backend Architecture

The application does **not** use a custom backend server. Instead, it relies on:

- **CouchDB** as a remote database for optional cloud sync (via PouchDB replication)
- **superlogin-client** for user authentication (username/password registration and login)

Backend responsibilities include:
- User authentication via **Google OAuth (SSO)**
- Vocabulary synchronization across devices
- **Persistent storage and analysis of usage logs**
- **Aggregation of suggestion effectiveness metrics**
- Usage analytics processing
- Personalization and preference management

## Data Storage

The data storage architecture includes:

- **PouchDB (Local Browser Storage)**
  - User grids and board configurations (GridData documents)
  - Grid element definitions (GridElement documents)
  - Board metadata and settings (MetaData documents)
  - Images and symbols (GridImage documents)
  - Encrypted data wrappers (EncryptedObject documents)
  - Usage history for prediction

- **CouchDB (Optional Remote Sync)**
  - Mirrors local PouchDB data for cross-device synchronization
  - User authentication via superlogin

- **Service Worker Cache**
  - Application assets (JS bundles, CSS, fonts, icons)
  - ARASAAC pictogram images (cached on first fetch)

## External Services and Integrations

The system integrates with:

- **ARASAAC API** for pictogram/symbol search and retrieval
- **CouchDB** for optional cloud data synchronization
- **superlogin** for user registration and authentication
- **ResponsiveVoice** as a complementary text-to-speech engine
- **Google OAuth** (planned) for SSO authentication alongside superlogin
- **ElevenLabs** (planned) for premium AI-powered voice synthesis

## Design Priorities

The application is designed with a strong emphasis on:
- Accessibility
- Offline functionality
- Personalization

These priorities ensure the system meets the diverse communication needs of AAC users and supports caregivers in configuring and maintaining the experience.
