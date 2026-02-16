---
id: architecture-diagrams
title: Architecture Diagrams
sidebar_label: Architecture Diagrams
---

# Architecture Diagrams

This section documents the key architectural diagrams for the AAC system. These diagrams provide both a structural and conceptual view of how the frontend and domain model are organized.

## AAC Application – Frontend Architecture

<img
  src="https://github.com/user-attachments/assets/4440ec47-84a0-46ff-b883-3647c76f14ea"
  alt="AAC Application – Frontend Architecture"
  style={{ maxWidth: "100%", height: "auto" }}
/>


This diagram illustrates the Vue-based frontend architecture of the AAC system. State is centralized in the Store, UI components compose the `AACBoard`, and service layers abstract speech synthesis and offline persistence. The `SpeechService` implements the Strategy pattern to allow dynamic selection between different speech engines (for example, the browser SpeechSynthesis API and the ElevenLabs service).

This layered structure improves separation of concerns by keeping presentation logic, state management, and infrastructure services decoupled from one another.

## AAC System – Domain Model Class Diagram

<img
  src="https://github.com/user-attachments/assets/07ff9a7c-b757-4d51-96d5-47348cf4cd3d"
  alt="AAC System – Domain Model Class Diagram"
  style={{ maxWidth: "100%", height: "auto" }}
/>


This diagram represents the core domain entities of the AAC system. A `User` owns multiple `Board` objects, each `Board` contains multiple `Tile` objects, and `Tile` instances may link to other `Board` instances to form a navigational hierarchy.

`UsageLog` entities track interaction history for analytics and potential adaptive features. Together, these classes define the core data model and relationships that drive application behavior.

---
