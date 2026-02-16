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

## PouchDB (Local Offline Storage)

PouchDB is a browser-based NoSQL database that enables offline-first data storage. It stores user data locally, including vocabulary sets, board configurations, user preferences, and usage history.

When connectivity is available, PouchDB can synchronize with a remote database (if configured). This allows the application to function without internet access while maintaining eventual consistency once the network is restored.

## Browser SpeechSynthesis (Web Speech API)

The built-in browser SpeechSynthesis API provides native text-to-speech functionality without relying on external services. It offers low-latency speech generation directly within the client environment.

This component serves as a fallback or lightweight alternative to ElevenLabs, reducing external API usage and ensuring basic speech functionality is available even when the application is offline.

## ElevenLabs (Cloud Text-to-Speech Service)

ElevenLabs is a cloud-based text-to-speech (TTS) service that provides high-quality neural voice synthesis. The application sends text payloads to the ElevenLabs API and receives streamed or buffered audio responses.

This service is used when higher fidelity or more natural-sounding speech output is required. API keys and request configuration are handled securely through environment variables or, if necessary, through a proxy layer to avoid exposing credentials in the client.

## ARASAAC (Pictogram Library)

ARASAAC is an open pictographic symbol system developed by the Government of Aragon (Spain) and distributed under a Creative Commons license. The application integrates with the ARASAAC API to search for and retrieve symbol images that are displayed on AAC grid tiles.

Pictograms provide visual representations of words and concepts, making communication boards accessible to users who rely on symbols rather than text. The service module handles symbol search queries, image URL construction, and caching of retrieved assets for offline use.

## Prediction Service (N-gram Word Prediction)

The prediction service is a client-side word suggestion engine built on bigram and trigram frequency models. It learns from user interactions by tracking which words follow other words, then generates ranked next-word suggestions based on the current input context.

The prediction model is stored locally in the browser using localStorage, requiring no external server or API. Suggestions are displayed in dedicated prediction-type grid elements, allowing users to select predicted words to accelerate sentence construction. The service also bootstraps initial vocabulary from the grid tile labels to provide useful predictions from first use.

## Service Worker (PWA / Offline Support)

The application registers a service worker that enables Progressive Web App (PWA) functionality, including offline access, asset caching, and background updates. Static resources such as JavaScript bundles, stylesheets, fonts, and symbol images are cached using a combination of cache-first and stale-while-revalidate strategies.

When the application detects a new version, it notifies the user and applies the update on the next page load. The service worker ensures that core communication functionality remains available even without an active internet connection.

## CouchDB Cloud Sync Service

The application provides optional cloud synchronization through CouchDB, enabling users to access their grids and settings across multiple devices. The sync service uses the superlogin-client library for authentication and establishes secure connections to a remote CouchDB instance.

When cloud sync is enabled, PouchDB automatically replicates local changes to the remote database and vice versa, providing conflict resolution and eventual consistency. Users can register an account, log in, and enable bidirectional sync while maintaining full offline functionality. The service connects to login1.couchdb.asterics-foundation.org in production environments.

## ResponsiveVoice TTS Service

ResponsiveVoice is a third-party text-to-speech library integrated into the application to provide high-quality speech synthesis with extensive language coverage. The library includes over 100 pre-configured voices across 50+ languages, offering an alternative to browser-native speech synthesis.

ResponsiveVoice voices are automatically detected and made available in the voice selection interface alongside native browser voices. The service operates client-side and does not require external API calls, making it suitable for offline use. The library is loaded from app/lib/responsive-voice.js and integrates seamlessly with the core speech service.

## External Speech Service API

The application includes a configurable external speech service framework (speechServiceExternal.js) that allows integration with any HTTP-based text-to-speech provider. Users can specify a custom TTS endpoint URL via application settings, enabling the use of premium or specialized speech services.

The external service API supports two voice types: streaming playback (where audio is played directly by the remote server) and data-based playback (where audio data is returned to the client). The framework implements voice discovery, caching, playback control, and status checking through standardized REST endpoints. This architecture enables future integration with services like ElevenLabs, Google Cloud TTS, or custom TTS infrastructure.

## HTTP REST Action Service

The HTTP REST Action Service (httpService.js) enables grid elements to trigger arbitrary HTTP requests to external APIs and web services. This component supports GET, POST, PUT, and DELETE methods with configurable headers, authentication, and request bodies.

To handle CORS restrictions, the service can route requests through a CORS proxy at proxy.asterics-foundation.org. This functionality allows AAC grids to control smart home devices, interact with web services, trigger webhooks, or retrieve external data. Response data can be displayed in live elements or used to trigger conditional actions, making the communication device extensible to any HTTP-compatible system.

## Cloud Board Repository Service

The Board Repository Service (boardService.js) provides access to a curated collection of pre-made communication boards hosted on GitHub. Users can browse, preview, and import board templates from asterics.github.io/AsTeRICS-Grid-Boards, significantly reducing setup time for new users.

The repository serves metadata files describing available boards, their categories, languages, and intended user groups. Boards are designed by the community and cover common communication scenarios, age groups, and topic areas. The service fetches board definitions remotely and imports them into the local PouchDB database, where they can be customized and personalized by the user.

## Live Element Service

The Live Element Service (liveElementService.js) enables grid elements to display dynamic, real-time content that updates automatically based on system state or external data. Supported display modes include current date/time in various formats, application state indicators (volume level, battery status), results from previous actions, and random value generation.

Live elements use the date-fns library for internationalized date/time formatting and support custom format strings. Display values update on configurable intervals or in response to system events. This service allows users to create context-aware communication boards that show relevant information like time-based greetings, system status, or data retrieved from HTTP actions.