---
sidebar_position: 1#Conceptual Design

---

# System OverviewDS
## Conceptual Design
The frontend of the Language Expansion app uses JavaScript and React or Vue.js to handle UI components and keep state organized. The app runs on multiple devices, such as desktop, tablet, and mobile. We decided to use a Progressive Web App (PWA) built with service workers and IndexedDB, which is crucial for keeping it fast to load and function offline. The main interface is an AAC grid for picking words and building sentences, which then triggers speech through the Web Speech API. 

On the backend infrastructure in Node.js with Express or Python using Flask, exposing everything through a REST API and WebSockets.User authentication via OAuth, vocabulary processing, and analytics are necessary for personalized suggestions. Server-Side Suggestion Engine, to compare to the client-side version and historical data to improve word prediction accuracy. The store's user profiles and history are stored in PostgreSQL or MongoDB, while the symbols and audio files will be served through a CDN. Finally,  containerize the backend or deploy it on cloud VMs so the whole system stays reliable and scalable as it grows.
