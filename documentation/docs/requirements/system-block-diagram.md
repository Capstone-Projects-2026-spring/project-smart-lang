---
sidebar_position: 2
---

# System Block Diagram

![System Block Diagram](https://github.com/user-attachments/assets/ef4b926b-0c1f-4d13-bb26-ca631a3e9bb0)


**Figure 1** provides an overview of the grid-based AAC (Augmentative and Alternative Communication) application architecture.

## System Overview

Users interact with the system through tablets, desktop computers, or mobile devices using a web browser. The application is implemented as a Progressive Web App (PWA), enabling cross-platform access and offline functionality.

## Frontend Architecture

The frontend is built using **React** with **HTML5** and **JavaScript** and consists of two primary interfaces:

- **AAC Grid UI**  
  Designed for communication users to select symbols and construct messages.

- **Caregiver Interface**  
  Used for configuration, vocabulary management, and system personalization.

The frontend follows an **offline-first architecture** using:
- **IndexedDB** for local data storage  
- **Service Workers** for caching and offline access  

This allows users to continue communicating even without an active internet connection.

## Communication Flow Components

Several core components work together to support message creation:

- **Word Selection Handler** – Processes symbol and word selections  
- **Sentence Builder** – Constructs complete messages from selected words  
- **Suggestion Engine** – Provides context-aware word predictions  

Completed sentences are converted to speech using the **Web Speech API**, enabling real-time text-to-speech output.

## Logging and Analytics Components

The system implements **persistent cloud-based logging** to track and analyze user interaction patterns:

- **Suggestion Logger** – Records all word predictions shown to users and their selection patterns
- **Vocabulary Usage Tracker** – Logs frequency and context of word/symbol usage
- **Event Logger** – Captures user interactions, session data, and communication patterns

**Logging Flow:**
1. Events captured locally in **IndexedDB** during offline sessions
2. Automatic synchronization to **cloud storage** when connectivity resumes
3. **Cloud-based log aggregation** for analytics and machine learning
4. All data anonymized and privacy-protected according to user preferences

**Cloud Analytics Services** process logs to:
- Generate usage insights and reports
- Improve suggestion algorithms
- Identify vocabulary patterns for personalization

## Backend Architecture

The backend is developed using **Node.js with Express** (or alternatively **Python with Flask**) and exposes functionality through:

- **REST APIs** for standard data operations  
- **Optional WebSocket connections** for real-time features  

Backend responsibilities include:
- User authentication via **Google OAuth (SSO)**
- Vocabulary synchronization across devices
- **Persistent storage and analysis of usage logs**
- **Aggregation of suggestion effectiveness metrics**
- Usage analytics processing
- Personalization and preference management

## Data Storage

The cloud-based data storage architecture includes:

- **Managed Cloud Databases** (e.g., AWS RDS PostgreSQL, Google Cloud SQL, Azure Cosmos DB)
  - User profiles  
  - Custom vocabularies  
  - Usage history  
  - **Suggestion interaction logs**
  - **Vocabulary usage statistics**
  - Personalization data  

- **Cloud Object Storage** (e.g., AWS S3, Google Cloud Storage, Azure Blob Storage)
  - Symbol and image assets  
  - Audio files  
  - Backup archives

- **Frontend Local Storage**
  - **IndexedDB** for offline data caching
  - **Service Worker cache** for application assets

- **File Storage**  
  - Symbol and image assets  
  - Audio files  

## External Services and Integrations

The system integrates with:

- **Cloud Provider Services** (AWS/GCP/Azure)
  - Authentication services (can replace or complement Google OAuth)
  - Cloud storage and databases
  - Content Delivery Network (CDN)
  - Monitoring and logging services
  
- **Google OAuth** for secure authentication  
- **Cloud-native Backup Services** for automated data preservation  
- **Analytics Services** (e.g., Google Analytics, AWS CloudWatch) for usage tracking with privacy safeguards

## Design Priorities

The application is designed with a strong emphasis on:
- Accessibility  
- Offline functionality  
- Personalization  

These priorities ensure the system meets the diverse communication needs of AAC users and supports caregivers in configuring and maintaining the experience.
