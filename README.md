# BorkedBot

## Running

You can get up and running really quickly with this project using Docker. There's a little configuration required up front, first:

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

### Running

Once all configure, simply run `docker compose up` from the root of this project. Your `.env` file will supply the necessary environment config and the `data/projectConfig.json` will drive the app configuration.

The `data` folder is mounted as a volume into the container, so your `data/projectConfig.json` file can be updated without rebuilding the container. The SQLite database will also be stored in this folder so you can move your database around.

Wait a few handful of minutes and your first sync will populate the database with the current state.

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
$ npx tailwindcss -i ./src/main.css -o ./assets/styles.css --watch

# build mode
$ npx tailwindcss -i ./src/main.css -o ./assets/styles.css

# prod build mode
$ npx tailwindcss -i ./src/main.css -o ./assets/styles.css --minify
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

### Run application in prod

```bash
$ NODE_ENV=production node dist/main.js