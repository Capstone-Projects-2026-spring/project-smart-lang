---
id: components
title: System Components
sidebar_label: Components
---

# System Components

This section describes the primary system components and their interfaces. Refer to the System Block Diagram for a visual overview of how these components interact within the AAC application.

## Vue (Frontend Application)

Vue is a progressive JavaScript framework used to build the client-side interface of the application. It manages reactive state, component rendering, and user interactions. The application is structured as a single-page application (SPA) using Vue 2.7 and runs entirely in the browser.

Vue communicates with local storage (PouchDB) and speech services through service modules. These service layers abstract speech synthesis, data persistence, and network communication from the UI components, improving modularity and maintainability. Application state is managed through a custom stateService.js module, and routing is handled by the Navigo library.

## PouchDB (Local Offline Storage)

PouchDB is a browser-based NoSQL database that enables offline-first data storage. It stores user data locally, including vocabulary sets, board configurations, user preferences, and usage history.

When connectivity is available, PouchDB synchronizes its data with a remote CouchDB database handling the core board sync, while Firebase Cloud Firestore separately synchronizes care-giver associations and specific board visibility configurations. This allows the application to function without internet access while maintaining eventual consistency once the network is restored.

## Browser SpeechSynthesis (Web Speech API)

The built-in browser SpeechSynthesis API provides native text-to-speech functionality without relying on external services. It offers low-latency speech generation directly within the client environment.

This component serves as the primary speech engine and provides basic speech functionality even when the application is offline. It is complemented by ResponsiveVoice for broader language coverage, with ElevenLabs integration planned for higher-quality voice synthesis.

## ARASAAC (Pictogram Library)

ARASAAC is an open pictographic symbol system developed by the Government of Aragon (Spain) and distributed under a Creative Commons license. The application integrates with the ARASAAC API to search for and retrieve symbol images that are displayed on AAC grid tiles.

Pictograms provide visual representations of words and concepts, making communication boards accessible to users who rely on symbols rather than text. The service module handles symbol search queries, image URL construction, and caching of retrieved assets for offline use.

## Prediction Service (N-gram Word Prediction)

The prediction service is a client-side word suggestion engine built on bigram and trigram frequency models. It learns from user interactions by tracking which words follow other words, then generates ranked next-word suggestions based on the current input context.

The prediction model is stored locally in the browser using localStorage, requiring no external server or API. Suggestions are displayed in dedicated prediction-type grid elements, allowing users to select predicted words to accelerate sentence construction. The service also bootstraps initial vocabulary from the grid tile labels to provide useful predictions from first use.

## Service Worker (PWA / Offline Support)

The application registers a service worker that enables Progressive Web App (PWA) functionality, including offline access, asset caching, and background updates. Static resources such as JavaScript bundles, stylesheets, fonts, and symbol images are cached using a combination of cache-first and stale-while-revalidate strategies.

When the application detects a new version, it notifies the user and applies the update on the next page load. The service worker ensures that core communication functionality remains available even without an active internet connection.

## Firebase Cloud Firestore Sync Service

The application provides optional cloud synchronization through Firebase Cloud Firestore, enabling users to access their grids and settings across multiple devices. The sync service uses Firebase Authentication for secure access and establishes real-time connections to a remote Cloud Firestore instance.

When cloud sync is enabled, local changes are automatically synchronized to the remote CouchDB database and vice versa, providing conflict resolution and eventual consistency. Users can register an account, log in using Google OAuth SSO (with Superlogin scaffolding the local database), and enable bidirectional sync while maintaining full offline functionality.

## ResponsiveVoice TTS Service

ResponsiveVoice is a third-party text-to-speech library integrated into the application to provide high-quality speech synthesis with extensive language coverage. The library includes over 100 pre-configured voices across 50+ languages, offering an alternative to browser-native speech synthesis.

ResponsiveVoice voices are automatically detected and made available in the voice selection interface alongside native browser voices. The service operates client-side and does not require external API calls, making it suitable for offline use. The library is loaded from app/lib/responsive-voice.js and integrates seamlessly with the core speech service.

## External Speech Service API

The application includes a configurable external speech service framework (speechServiceExternal.js) that allows integration with any HTTP-based text-to-speech provider. Users can specify a custom TTS endpoint URL via application settings, enabling the use of premium or specialized speech services.

The external service API supports two voice types: streaming playback (where audio is played directly by the remote server) and data-based playback (where audio data is returned to the client). The framework implements voice discovery, caching, playback control, and status checking through standardized REST endpoints. This architecture enables future integration with services like Google Cloud TTS or custom TTS infrastructure.

## ElevenLabs (Planned Integration)

ElevenLabs is a premium AI-powered text-to-speech service that offers high-quality, natural-sounding voice synthesis with support for multiple languages and voice cloning. Integration with ElevenLabs is planned as an additional speech provider within the External Speech Service framework. Once implemented, users will be able to select ElevenLabs voices alongside browser-native and ResponsiveVoice options for enhanced speech quality.

## Google OAuth via Firebase Authentication

Google OAuth is integrated as the primary authentication method via Firebase Authentication. Users can sign in with their Google account using OAuth 2.0 SSO. This provides a simplified login experience, a unified account system, and seamless support for linked caregiver-student profile workflows. While Firebase manages OAuth and cross-device syncing, the system retains Superlogin for bootstrapping offline-first local PouchDB databases using the generated Google UID.

## Firestore Sync Service

The Firestore Sync Service (firestoreSyncService.js) acts as the central mechanism for cloud storage. It handles synchronization of caregiver and student profile associations, visibility configurations, board assignments, and general data backups. It uses Firebase Authentication to derive a deterministic student ID from the user's UID and provides real-time updates for assigned communication boards, augmenting the local offline architecture provided by PouchDB.

## HTTP REST Action Service

The HTTP REST Action Service (httpService.js) enables grid elements to trigger arbitrary HTTP requests to external APIs and web services. This component supports GET, POST, PUT, and DELETE methods with configurable headers, authentication, and request bodies.

To handle CORS restrictions, the service can route requests through a configurable CORS proxy. This functionality allows AAC grids to control smart home devices, interact with web services, trigger webhooks, or retrieve external data. Response data can be displayed in live elements or used to trigger conditional actions, making the communication device extensible to any HTTP-compatible system.

## Board Repository Service

The Board Repository Service (boardService.js) provides the structure for accessing pre-made communication board templates. Users can browse, preview, and import board templates to reduce setup time.

The repository serves metadata files describing available boards, their categories, languages, and intended user groups. Boards cover common communication scenarios, age groups, and topic areas. The service imports board definitions into the local PouchDB database, where they can be customized and personalized by the user.

## Live Element Service

The Live Element Service (liveElementService.js) enables grid elements to display dynamic, real-time content that updates automatically based on system state or external data. Supported display modes include current date/time in various formats, application state indicators (volume level, battery status), results from previous actions, and random value generation.

Live elements use the date-fns library for internationalized date/time formatting and support custom format strings. Display values update on configurable intervals or in response to system events. This service allows users to create context-aware communication boards that show relevant information like time-based greetings, system status, or data retrieved from HTTP actions.
