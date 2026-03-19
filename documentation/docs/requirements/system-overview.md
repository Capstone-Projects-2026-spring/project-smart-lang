---
sidebar_position: 1
title: System Overview
---

## Conceptual Design

The frontend of the AAC application is built using JavaScript with Vue 2.7 to manage UI components and application state. The application is designed to run across multiple platforms, including desktop, tablet, and mobile devices. A Progressive Web App (PWA) architecture is used, leveraging service workers and IndexedDB (via PouchDB) to ensure fast load times and reliable offline functionality. The primary user interface is an AAC grid that allows users to select words and construct sentences, which are then converted to speech using the Web Speech API or ResponsiveVoice.

Data persistence is handled entirely through PouchDB, a browser-based NoSQL database that stores user data locally. When cloud sync is enabled, PouchDB synchronizes with a remote CouchDB instance using the superlogin-client library for authentication. Users currently authenticate with a username and password, with Google OAuth SSO planned as an additional authentication method. Word prediction is performed client-side using an n-gram model (bigrams and trigrams) that learns from user interactions and is stored in localStorage. No server-side prediction engine or analytics backend is needed. Symbol images are retrieved from the ARASAAC API and cached locally by the service worker for offline use. ElevenLabs integration is planned as an additional premium speech synthesis option alongside the existing browser SpeechSynthesis API and ResponsiveVoice.

## Project Abstract

This document proposes an Augmentative and Alternative Communication (AAC) web application that combines a virtual communication board with next-word prediction to provide a more seamless and efficient communication experience. Users select words from a communication grid, after which the system suggests subsequent words based on either algorithmic predictions or caregiver input. This approach is intended to encourage vocabulary growth through exposure to previously unfamiliar words.

By interpreting words within the context of the surrounding sentence and accompanying images, users—particularly children—can infer meaning more effectively. Overall, the application aims to deliver an engaging, educational, and accessible communication tool that supports both communication and language development.

## Background

Existing AAC solutions such as Grid by Smartbox and TouchChat by Saltillo are widely used but are closed-source and often prohibitively expensive. While these cost and accessibility issues are prevalent and problematic in the AAC space, the primary challenge Smart-Lang addresses is that traditionally laid-out grids often do not contain the language users need most frequently in convenient layouts. Furthermore, these traditional grids fail to support natural language acquisition through the expansion of vocabulary with contextually relevant words. Smart-Lang seeks to resolve this by providing a web-based AAC communication board that emphasizes vocabulary growth and accessible language alongside communication.

Like existing solutions, Smart-Lang enables users to construct sentences by selecting words on a touch-based interface. However, it differentiates itself through intelligent word suggestion, caregiver-assisted input, and customization features. Caregivers can add new vocabulary by providing associated words, images, and voice recordings. The application also supports category-based organization of words and sentence construction, offering functionality comparable to established AAC tools while remaining more flexible and affordable.
