---
sidebar_position: 4
---

# Development Environment
Here is a step-by-step guide to configure a local development environment for the Language Expansion AAC project. Following these procedures ensures that the workstation meets language-expansion-app accessibility standards, which support images with text and audio.

# 1. Prerequisites

Starting the project, confirm that the following dependencies are installed on your system:

* Using Node.js version 18.x or higher.
* Using a package manager and  npm included with Node.
* Using the GitHub version control system github.com.
* Using Jira Accessand ensure you have access to the LE Project Jira Board.
* Using the IDE  Visual Studio Code with the "i18n Ally" extension to manage translations.

# 2. Getting the Code

Clone the repository on the local machine.

https://github.com/Capstone-Projects-2026-spring/project-smart-lang.git

# 3. Installation
Install dependencies and the localization engine:

npm install

# 4. Environment Variables

Create a .env file in the root directory. We will need to add specific keys for the Translation API and Speech-to-Text services.

cp .env.example .env
 * Set up the API_KEY, such as Deepl or google to translate API key, to null.
* Will be using TTS_ENGINE for the text-to-speech of the browser.
* The DEFAULT_LOCALE is the initial language code in the format of en-us. 

# 5. Asset Management 
The AAC project uses a large library of symbols (SCLERA/Mulberry) and audio files.

* To get the latest image library, run npm run download-assets. This will add the images to /public/assets/symbols.
* Localized JSON files for dictionaries are in /src/data/locales. Be careful not to overwrite the base schema.json.
