---
sidebar_position: 1
title: Conceptual Design
---

# System OverviewDS
## Conceptual Design
The frontend of the Language Expansion app uses JavaScript and React or Vue.js to handle UI components and keep state organized. The app runs on multiple devices, such as desktop, tablet, and mobile. We decided to use a Progressive Web App (PWA) built with service workers and IndexedDB, which is crucial for keeping it fast to load and function offline. The main interface is an AAC grid for picking words and building sentences, which then triggers speech through the Web Speech API. 

On the backend infrastructure in Node.js with Express or Python using Flask, exposing everything through a REST API and WebSockets.User authentication via OAuth, vocabulary processing, and analytics are necessary for personalized suggestions. Server-Side Suggestion Engine, to compare to the client-side version and historical data to improve word prediction accuracy. The store's user profiles and history are stored in PostgreSQL or MongoDB, while the symbols and audio files will be served through a CDN. Finally,  containerize the backend or deploy it on cloud VMs so the whole system stays reliable and scalable as it grows.

## Project Abstract

This document proposes an Augumentative and Alternate Communication (AAC) web application that combines the benefit of a virtual communication board with next word prediction to allow a more seamless user experience and streamline the communication process. The application allows users to select words on their communication board and automatically have the following word suggested by either our algorithm or a caregiver with the intent of inspiring vocabulary growth through use of previously-unknown words. The child using the application will be able to infer the meaning of the words through the context of the rest of the sentence combined with the accompanying picture. By using this application, users will have an engaging, efficient, and educational communication experience and a way to grow their vocabulary.

## Background

Similar products include Grid by Smartbox or TouchChat by Saltillo. These applicatons are both closed-source and prohibitevely expensive, with the first costing $11 a month and the second being a one-time payment of $299. Smart-Lang is an online AAC communication board that aims to be more assistive in the context of growing the users vocabulary. The Smart-Lang app is similar to Grid or TouchChat in the sense that it allows users to select words on a touch-screen to produce speech, but it differs in its smart word suggestion algorithm, or caregiver intervention via word suggestion. Caregivers also have the ability to incorporate new words to the users database by providing a word, picture, and voice line. The Smart-Lang app will include some of the same features as Smartbox or TouchChat, such as words organized by categories and allowing the stringing together of words to produce sentences. 
