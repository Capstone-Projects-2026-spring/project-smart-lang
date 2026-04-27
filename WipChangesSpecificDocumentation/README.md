# Wip Changes Specific Documentation

This directory contains the updated documentation for the Smart Lang AAC project. It is built using [Docusaurus 3](https://docusaurus.io/), a modern static website generator.

This folder is intended to be merged into the main `documentation` folder once the WIP changes and Firebase migrations are finalized. 

## Local Development

1. Run `yarn install` inside this directory to install dependencies.
2. Run `yarn start` to start the local Docusaurus server.

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Building

```bash
yarn build
```

This command generates static content into the `build` directory and can be served using any static hosting service.

### Installation

```
$ yarn
```

### Local Development

```
$ PROJECT_NAME=your-project-name yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ PROJECT_NAME=your-project-name yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

Using SSH:

```
$ USE_SSH=true yarn deploy
```

Not using SSH:

```
$ GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.

