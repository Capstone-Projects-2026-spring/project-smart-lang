<div align="center">

# Smart Lang
[![Report Issue on Jira](https://img.shields.io/badge/Report%20Issues-Jira-0052CC?style=flat&logo=jira-software)](https://temple-cis-projects-in-cs.atlassian.net/jira/software/c/projects/DT/issues)
[![Deploy Docs](https://github.com/capstone-projects-2026-spring/project-smart-lang/actions/workflows/deploy.yml/badge.svg)](https://github.com/capstone-projects-2026-spring/project-smart-lang/actions/workflows/deploy.yml)
[![Documentation Website Link](https://img.shields.io/badge/-Documentation%20Website-brightgreen)](https://capstone-projects-2026-spring.github.io/project-smart-lang/)
[![Completed Jira Tickets](https://img.shields.io/badge/Completed_Tickets-Jira-blue)](https://temple-cis-projects-in-cs.atlassian.net/jira/software/c/projects/LE/list?filter=StatusCategory%20%3D%20%27Complete%27)

## Online Hosting

You can access this app online without having to run or install anything at https://smartlangaac.netlify.app/

</div>

## Project Overview

### Introduction

Smart Lang AAC is an augmentative and alternative communication (AAC) web application designed to help users build and speak phrases using configurable symbol grids.

- The project is implemented as an offline-first progressive web application (PWA):
- The UI is built with Vue and custom grid components.
- Local data persistence is handled with PouchDB.
- Optional cloud sync is supported through Firebase Firestore.
- Authentication is handled seamlessly via Firebase Google OAuth.
- Speech output is provided through browser SpeechSynthesis and ResponsiveVoice.

## Features Implemented in this Release
- **Cloud Syncing**: Seamless cloud synchronization using Firebase Firestore allows caregivers to save configuration automatically.
- **Push Board to Student**: Caregivers can dynamically push board assignments and specific tile visibility configurations to students in real-time.
- **Improved Modal UX**: Users can now click outside the "Manage Tiles" board modal to close it easily, instead of having to scroll up and press the 'x' button.
- **Firebase Authentication**: Integrated Google OAuth for smooth login experiences.

## Known Bugs
- The initial cloud sync might experience a slight delay depending on network connectivity.
- Some strict browsers (e.g., Safari on iOS) may require manual screen interaction before Text-to-Speech voices initialize.
- Board syncing is sometimes inconsistent. Clearing browser cache or re-pushing may fix it.

## Configuration Instructions
To run the app with full cloud sync, you must set up Firebase. Create a `.env.local` file in the root directory with your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Configure your **Firestore Security Rules** in the Firebase Console as follows:
```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Caregivers read/write their own profile (keyed by Firebase UID)
    match /caregivers/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    // Students: any authenticated user can read/write
    // (student IDs like SL-XXXX are not Firebase UIDs — app logic enforces ownership)
    match /students/{studentId} {
      allow read:  if request.auth != null;
      allow write: if request.auth != null;
    }
    // Board assignments: any authenticated user can read/write
    match /boardAssignments/{assignmentId} {
      allow read:  if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## Running the Application Locally
1. Download and extract the zip file or clone the repository.
2. Install yarn `npm install --global yarn` if necessary.
3. Create your `.env.local` file following the configuration above.
4. In a terminal within the project folder, type `yarn install` followed by `yarn run start`.
5. Open `http://localhost:9095` in your browser. It might take a bit to start up. Just give it a few minutes.

## Build and Installation Instructions
**To build for production:**
1. Ensure all dependencies are installed: `yarn install`
2. Run the build script: `yarn run build`
3. All production artifacts will be grouped alongside `index.html` and the `app/build/` directory.

**To install on a target device:**
- Because this project is an Offline-First Progressive Web App (PWA), you must host the files on a static server (e.g., Netlify, Firebase Hosting).
- After hosting, open the app's URL on the target device (like an iPad or Android tablet) and tap **"Add to Home Screen"**. The application will cache and function offline.

## Testing
To run tests:
1. Install dependencies if you haven't with `yarn install`
2. In a terminal within the project folder, type `yarn test`

## Collaborators

<div align="center">

[//]: # (Replace with your collaborators)
[Jeeae Chae](https://github.com/jeeae3/) • [Jason Jaya](https://github.com/jason-jaya/) • [Cameron Kerestus](https://github.com/Teamk09/) • [Egi Rama](https://github.com/egirama/) • [Abdulrazig Mohammed](https://github.com/Abdu9991/) • [Oswayne Smith](https://github.com/oswaynesmith)

</div>
