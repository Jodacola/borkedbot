# BorkedBot

**What is this?**

* Do you have a lot of projects your team(s) support, like a microservices-heavy environment?
* Do you use integrations like GitHub for Slack to track PR progress or workflow notifications?
* Have you wanted to tear your hair out trying to keep track of the failure state of PRs and workflows across these several different repositories by following the Slack notifications or clicking through GitHub?

*BorkedBot is for you!*

I built this to help me keep a birds-eye view on my team's several projects after I got frustrated trying to keep up with what's going on through other means. I didn't want to spend the amount of time I was spending or the mental overhead bouncing between GitHub repos or trying to follow along with fast-moving notification channels in Slack. I needed a way to know where I needed to dive in to help out my team quickly and effectively.

From that pain and frustration, BorkedBot was born.

BorkedBot is meant to be used as a personal project:

* It polls against GitHub APIs, which isn't an advised approach (but it works for small things like this that [don't scale](https://paulgraham.com/ds.html))
* It's set up to be run with in a way that may be unfriendly to non-technical folks (manual configuration of a config file *or* set up with an agent via MCP)
* It stores in a local SQLite database for portability and ease of setup
* It hasn't been built to be run in a deployed fashion, and hasn't been tested in such a setup so, if you try to do so, you're doing it **at your own risk**

But hey, as far as personal apps go, it's given me what I need and I keep finding little improvements to make my own experience better. I hope you find some use out of it, too.

## Running

You can get up and running really quickly with this project using Docker. There's a little configuration required up front:

### Setting up your `data/projectConfig.json`

This directs the application to set up your group(s) and the GitHub repos it'll watch.

* Copy `data/projectConfig.example.json` to `data/projectConfig.json`
* Update accordingly
* Review [the Config system setup documentation for more information](src/config/README.md)

### Setting up your `.env`

This provides the application with your necessary GitHub token and whether to enable the GitHub sync.

* Copy `.env.example` to `.env`
* Update the values accordingly

You'll need `GITHUB_SYNC_ENABLED=true` if you want to pull down an initial set of data.

You'll also need a GitHub PAT that has the correct access to the repositories you want to monitor.

### Running

Once all configured, simply run `docker compose up` from the root of this project. Your `.env` file will supply the necessary environment config and the `data/projectConfig.json` will drive the app configuration.

The `data` folder is mounted as a volume into the container, so your `data/projectConfig.json` file can be updated without rebuilding the container. The SQLite database will also be stored in this folder so you can move your database around.

Wait a few handful of minutes and your first sync will populate the database with the current state.

## MCP Usage

This project provides an MCP (Model Context Protocol) server that can be used to manage groups, projects, and monitor their statuses. The MCP server is available at the `/sse` endpoint and provides several tools for automation and integration.

### Available Tools

#### Group Management
- **`create-or-update-group-tool`** - Creates a new group or updates an existing one by ID
- **`delete-group-tool`** - Deletes a group and all its associated projects, pull requests, and snapshots
- **`list-groups-tool`** - Lists all available groups with their project counts
- **`group-status-tool`** - Gets detailed status information for a specific group including projects and recent snapshots

#### Project Management
- **`create-or-update-project-tool`** - Creates a new project or updates an existing one within a group
- **`delete-project-tool`** - Deletes a project and all its associated pull requests and snapshots
- **`list-projects-tool`** - Lists all projects across all groups
- **`project-status-tool`** - Gets detailed status information for a specific project including open pull requests

### Usage Example

The MCP server can be integrated with various MCP clients to automate group and project management tasks. Each tool accepts specific parameters and returns structured data about the operation results.

For example, to create a new group:
```json
{
  "name": "create-or-update-group-tool",
  "arguments": {
    "id": "my-team",
    "name": "My Development Team"
  }
}
```

The server will handle the creation and return the group details, or update an existing group if the ID already exists.

## Local Development

### General setup

Following instructions for users of `nvm`; tailor to your liking for managing versions of Node.

Install [nvm](https://github.com/nvm-sh/nvm).

```bash
# one time: install proper Node version
$ nvm install

# use the Node version
$ nvm use
```

### Project setup

```bash
$ npm install
```

### Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

### Compile tailwindcss for project

```bash
# watch mode
$ npx tailwindcss -i ./src/main.css -o ./src/assets/styles.css --watch

# build mode
$ npx tailwindcss -i ./src/main.css -o ./src/assets/styles.css

# prod build mode
$ npx tailwindcss -i ./src/main.css -o ./src/assets/styles.css --minify
```

### Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```