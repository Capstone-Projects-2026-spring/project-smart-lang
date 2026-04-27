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

## Running the Application Locally:
1. Create a `.env.local` file with your Firebase configuration.
2. Download and extract the zip file or clone the repository.
3. Install yarn `npm install --global yarn` if necessary.
4. In a terminal within the project folder, type `yarn install` followed by `yarn run start`.
5. Open `http://localhost:9095` in your browser.
It might take a bit to start up. Just give it a few minutes.

## Testing
To run tests:
1. Install dependencies if you haven't with `yarn install`
2. In a terminal within the project folder, type `yarn test`

## Collaborators

<div align="center">

[//]: # (Replace with your collaborators)
[Jeeae Chae](https://github.com/jeeae3/) • [Jason Jaya](https://github.com/jason-jaya/) • [Cameron Kerestus](https://github.com/Teamk09/) • [Egi Rama](https://github.com/egirama/) • [Abdulrazig Mohammed](https://github.com/Abdu9991/) • [Oswayne Smith](https://github.com/oswaynesmith)

</div>
