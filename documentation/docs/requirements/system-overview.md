---
sidebar_position: 1
title: System Overview
---

## Conceptual Design

The frontend of the Language Expansion application is built using JavaScript with React or Vue.js to manage UI components and application state. The application is designed to run across multiple platforms, including desktop, tablet, and mobile devices. A Progressive Web App (PWA) architecture is used, leveraging service workers and IndexedDB to ensure fast load times and reliable offline functionality. The primary user interface is an AAC grid that allows users to select words and construct sentences, which are then converted to speech using the Web Speech API.

The backend is implemented using Node.js with Express or Python with Flask and exposes functionality through REST APIs and WebSockets. Core backend responsibilities include user authentication via OAuth, vocabulary processing, and analytics to support personalized word suggestions. A server-side suggestion engine compares client-side interactions with historical usage data to improve word prediction accuracy over time. User profiles and usage history are stored in PostgreSQL or MongoDB, while symbol images and audio files are delivered via a CDN. The backend services are containerized or deployed on cloud-based virtual machines to ensure scalability, reliability, and maintainability.

## Project Abstract

This document proposes an Augmentative and Alternative Communication (AAC) web application that combines a virtual communication board with next-word prediction to provide a more seamless and efficient communication experience. Users select words from a communication grid, after which the system suggests subsequent words based on either algorithmic predictions or caregiver input. This approach is intended to encourage vocabulary growth through exposure to previously unfamiliar words.

By interpreting words within the context of the surrounding sentence and accompanying images, users—particularly children—can infer meaning more effectively. Overall, the application aims to deliver an engaging, educational, and accessible communication tool that supports both communication and language development.

## Background

Existing AAC solutions such as Grid by Smartbox and TouchChat by Saltillo are widely used but are closed-source and often prohibitively expensive. Grid typically requires a monthly subscription, while TouchChat involves a high one-time purchase cost. Smart-Lang seeks to provide a more accessible, web-based AAC communication board that emphasizes vocabulary growth alongside communication.

Like existing solutions, Smart-Lang enables users to construct sentences by selecting words on a touch-based interface. However, it differentiates itself through intelligent word suggestion, caregiver-assisted input, and customization features. Caregivers can add new vocabulary by providing associated words, images, and voice recordings. The application also supports category-based organization of words and sentence construction, offering functionality comparable to established AAC tools while remaining more flexible and affordable.
