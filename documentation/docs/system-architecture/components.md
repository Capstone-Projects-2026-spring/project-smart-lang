---
id: components
title: System Components
sidebar_label: Components
---

# System Components

This section describes the primary system components and their interfaces. Refer to the System Block Diagram for a visual overview of how these components interact within the AAC application.

## Vue (Frontend Application)

Vue is a progressive JavaScript framework used to build the client-side interface of the application. It manages reactive state, component rendering, and user interactions. The application is structured as a single-page application (SPA) and runs entirely in the browser.

Vue communicates with external services (such as ElevenLabs) and local storage (PouchDB) through service modules. These service layers abstract speech synthesis, data persistence, and network communication from the UI components, improving modularity and maintainability.

## ElevenLabs (Cloud Text-to-Speech Service)

ElevenLabs is a cloud-based text-to-speech (TTS) service that provides high-quality neural voice synthesis. The application sends text payloads to the ElevenLabs API and receives streamed or buffered audio responses.

This service is used when higher fidelity or more natural-sounding speech output is required. API keys and request configuration are handled securely through environment variables or, if necessary, through a proxy layer to avoid exposing credentials in the client.

## PouchDB (Local Offline Storage)

PouchDB is a browser-based NoSQL database that enables offline-first data storage. It stores user data locally, including vocabulary sets, board configurations, user preferences, and usage history.

When connectivity is available, PouchDB can synchronize with a remote database (if configured). This allows the application to function without internet access while maintaining eventual consistency once the network is restored.

## Browser SpeechSynthesis (Web Speech API)

The built-in browser SpeechSynthesis API provides native text-to-speech functionality without relying on external services. It offers low-latency speech generation directly within the client environment.

This component serves as a fallback or lightweight alternative to ElevenLabs, reducing external API usage and ensuring basic speech functionality is available even when the application is offline.

## Optional Supporting Infrastructure

### Hosting Environment

The Vue application is deployed as a static build served through a cloud hosting provider or CDN. Static assets, including JavaScript bundles, stylesheets, and media files, are delivered efficiently to ensure fast load times and reliable global access.

### API Proxy Layer (Optional)

If sensitive credentials such as the ElevenLabs API key must be protected, a lightweight backend proxy layer can be used. This proxy handles authenticated requests to external services and forwards only the necessary responses to the client, preventing direct exposure of secrets in the frontend.
