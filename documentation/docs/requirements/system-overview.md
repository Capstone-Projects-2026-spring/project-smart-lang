---
sidebar_position: 1#Conceptual Design

---

# System OverviewDS
## Conceptual Design
The frontend of the Language Expansion app using JavaScript and React or  Vue to handle the UI components and keep the state organized. The app runs directly in the browser, so it’ll work across desktop,tablet, and mobile. We decided to utilize a Progressive Web App (PWA) based on service workers and IndexedDB, which is crucial for keeping it fast load and function offline. The main interface is an AAC grid for picking words and building sentences, which then triggers speech through the Web Speech API. We’re also including a drawing interface built on HTML Canvas. It’s meant to be used with a stylus or touch input, which we think is a much better alternative to burying everything in complicated menus.

On the backend infrastructure in Node.js with Express or Python using Flask or Django, exposing everything through a REST API and WebSockets.The user authentication via OAuth, vocabulary processing, and the analytics needed for personalized suggestions. For the drawing recognition, plan to use an ensemble of models, potentially mixing a custom recognition model with services like AWS Rekognition or OpenAI to get the accuracy as needed. The store user profiles and history in PostgreSQL or MongoDB, while the symbols and audio files will be served through a CDN. Finally,  containerize the backend or deploy it on cloud VMs so the whole system stays reliable and scalable as it grows.
