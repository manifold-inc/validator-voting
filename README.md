# Validator Voting

The goal of the validator voting is to give delegators a simple way to directly
stake and remove stake to their validator. This also provides a Supabase database
that tracks the delegators wallet and their allocation of weights across subnets so that
the Validator can make a conscious decision on their weights based off of the delegators voice. The weighted average of the
delegators weights in respect to their stake is also shown to the end user.

This is designed as a template for validators to take and create their own branded voting applications,
however pull requests are always encouraged.

## Setup

### 1. Fork this repository to your own github account

### 2. Set up Supabase Database

Below are steps to create a Supabase connection string:

1. Either create an account or log in to Supabase
1. You might be asked to create an organization. In which case, choose the options best suited for your use case.
1. Once completed, create a new project with a secure password and location of your choosing. Save your password, you will need it later. Your project will then take a few minutes to be provisioned.
1. Once the project has been created, click on the green Connect button near the top right of the screen
1. A modal should open up. Click on connection string and URI.
1. Copy the connection string shown and insert your password

### 2. Copy `.env.exmaple` to `.env`

Fill in `DATABASE_URL` to your connection string you copied from Supabase with your saved password.

Fill in `NEXT_PUBLIC_VALIDATOR_NAME` with your name as a Validator.

Fill in `NEXT_PUBLIC_VALIDATOR_ADDRESS` with your SS58 Address.

Fill in `NEXT_PUBLIC_VALIDATOR_EXTENSION_ID` with the extension that you wish Polkadot to show to your users as the application asking for access.

### 3. Setup and Run the Application

This project uses a Justfile to simplify setup and execution. Follow these steps:

1. Install [just](https://github.com/casey/just#installation) if you haven't already.

2. Install [bun](https://bun.sh/) if you haven't already.

3. In the project root directory, run the following command to install dependencies and set up the database:

   ```sh
   just setup
   ```

   This will install the project dependencies and initialize the database schema.

### 4. Running the Application

To start the development server:

```sh
just dev
```

To build the application for production:

```sh
just build
```

### 5. Docker Setup for Stake Updater

The application includes a stake updater that runs in a Docker container. To set it up:

1. Copy `/stake_updater/.env.example` to `/stake_updater/.env`
2. Fill in the `.env` file with your Supabase connection details (available in your Supabase project settings)

3. To build and start the Docker container:

   ```sh
   just docker-start
   ```

   This will build the Docker image and run the container in detached mode.

4. To stop and remove the Docker container:

   ```sh
   just docker-stop
   ```

### 6. Full Setup and Start

To perform a full setup, including starting the development server and the Docker container:

```sh
just start-all
```

This command will set up the project, start the Docker container, and run the development server.

### 7. Stopping All Services

To stop all services and clean up:

```sh
just stop-all
```

This will stop and remove the Docker container.

Note: The stake updater in the Docker container updates the database with the "true" staked value on chain every 72 minutes. If you don't run this container, your database won't have up-to-date stake information.

### 8. Create Vercel account and push project

Create a [vercel](https://vercel.com/) account and hookup your github to it. Add
a new project and import your forked github repo and paste in your .env file

For production:

1. Remember to change from your test validator address to your finney validator address
1. Change `subtensor = SubtensorInterface(os.getenv("__finney_test_entrypoint__"))` to `subtensor = SubtensorInterface(os.getenv("__finney_entrypoint__"))`

### Completion

Your application should now be operational. Make sure you test everything yourself
before advertising it.

## How to Contribute

### Code Review

Manifold welcomes all PR's for the betterment of the subnet and Bittensor as a whole. We are striving for improvement at every interval and believe through open
communication and sharing of ideas will success be attainable. We are happy to help with any questions in our Discord.
