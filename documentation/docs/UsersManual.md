# Smart Lang AAC - User's Manual

## Purpose
This manual describes how to use and maintain the Smart Lang AAC system. It provides instructions for both the end-user (caregivers/students) and the maintainers.

## Quick Start Guide
*For the experienced user.*

1. **Access the Application**: Navigate to https://smartlangaac.netlify.app/ in your browser.
2. **Login**: Click "Sign in with Google" to access your caregiver or student account.
3. **Communicate**: Tap on tiles to construct phrases; the app will speak the phrase via text-to-speech.

## Installation
The system is built as an Offline-First Progressive Web App (PWA). No installation is required.

**Server Deployment (Maintainers):**
1. Ensure `yarn` is installed.
2. Run `yarn install` to fetch dependencies.
3. Run `yarn run build` to generate the production build artifacts.
4. Deploy the contents of the `app/build/` directory and root HTML to a static host (e.g., Netlify, Firebase Hosting) OR use `yarn start` to run locally.

## Configuration
Requires setup of Firebase environment for cloud synchronization.

1. Ensure a `.env.local` file exists with:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
2. Update Firestore Security Rules in the Firebase Console as outlined in the maintainer documentation.

## Security
- **Passwords**: Authentication is handled via Google OAuth. The system does not store passwords locally or in its own database.
- Please ensure that caregivers do not share their physical devices if it remains logged into a sensitive account.

## Database
- **Offline Mode**: Uses local `PouchDB`. Data is stored in the browser's IndexedDB. No external database maintenance required for isolated clients.
- **Cloud Mode**: Uses `Firebase Firestore`.

## Application Functions
- **Tile Management**: Caregivers can edit, hide, and assign visibility to specific tiles dynamically to a student's board.
- **Speech Synthesis**: The words attached to clicked tiles will be read aloud sequentially.
- **Push Boards**: Caregivers can assign entire communication boards immediately to specific students.

## Backup and Recovery
- All local user configurations are maintained in your browser's persistent storage. 
- Provided the device is online and signed into Google, changes are automatically synced to Firebase. To recover an account, simply login onto a new device via the same Google account.

## Troubleshooting
- **Board Sync Inconsistent**: Clear your browser's cache or refresh the page, then try re-pushing the board assignment from the caregiver account.

## Support
For technical issues, contact the maintainers at the linked Jira Helpdesk or directly via the project repository's Issue Tracker.
