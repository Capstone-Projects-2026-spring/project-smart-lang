---
sidebar_position: 2
---

# System Block Diagram

<img
  src="https://github.com/user-attachments/assets/ef4b926b-0c1f-4d13-bb26-ca631a3e9bb0"
  alt="System Block Diagram"
  style="max-width: 100%; height: auto;"
/>


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

## Backend Architecture

The backend is developed using **Node.js with Express** (or alternatively **Python with Flask**) and exposes functionality through:

- **REST APIs** for standard data operations  
- **Optional WebSocket connections** for real-time features  

Backend responsibilities include:
- User authentication via **Google OAuth (SSO)**
- Vocabulary synchronization across devices
- Usage analytics processing
- Personalization and preference management

## Data Storage

Data storage is divided into two main categories:

- **Databases (PostgreSQL or MongoDB)**  
  - User profiles  
  - Custom vocabularies  
  - Usage history  
  - Personalization data  

- **File Storage**  
  - Symbol and image assets  
  - Audio files  

## External Services and Integrations

The system integrates with several external services:

- **Google OAuth** for secure authentication  
- **Cloud Backup Services** for data preservation  
- **Analytics Services** for usage tracking (with privacy safeguards)  
- **Content Delivery Network (CDN)** for efficient delivery of static assets  

## Design Priorities

The application is designed with a strong emphasis on:
- Accessibility  
- Offline functionality  
- Personalization  

These priorities ensure the system meets the diverse communication needs of AAC users and supports caregivers in configuring and maintaining the experience.
