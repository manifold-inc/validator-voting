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
2. You might be asked to create an organization. In which case, choose the options best suited for your use case.
3. Once completed, create a new project with a secure password and location of your choosing. Save your password, you will need it later. Your project will then take a few minutes to be provisioned.
4. Once the project has been created, click on the green Connect button near the top right of the screen
5. A modal should open up. Click on connection string and URI.
6. Copy the connection string shown and insert your password

### 3. Copy `.env.example` to `.env`

Fill in `DATABASE_URL` to your connection string you copied from Supabase with your saved password.

Fill in `NEXT_PUBLIC_VALIDATOR_NAME` with your name as a Validator.

Fill in `NEXT_PUBLIC_VALIDATOR_ADDRESS` with your SS58 Address.

Fill in `NEXT_PUBLIC_VALIDATOR_EXTENSION_ID` with the extension that you wish Polkadot to show to your users as the application asking for access.

Fill in `NEXT_PUBLIC_VALIDATOR_EXTENSION_ID` with the extension that you wish Polkadot to show to your users as the application asking for access.

Fill in `NEXT_PUBLIC_INCLUDE_OWNER_VOTES` with "True" if you want to include Validator Owner staked amount in your Weight calculation. If you do not want to include Validator Owner staked amount, remove `NEXT_PUBLIC_INCLUDE_OWNER_VOTES`

### 4. Install Required Tools

1. Install [bun](https://bun.sh/) if you haven't already.

2. Install [Docker](https://docs.docker.com/get-docker/) if you haven't already.

## Available Commands

Here's a list of available commands and their explanations:

### Setup Application

```sh
bun install
bun db:push
```

Installs project dependencies using Bun and sets up the database schema.

### Run Development Server

```sh
bun dev
```

Starts the development server using Bun.

### Build for Production

```sh
bun run build
```

Builds the application for production using Bun.

### Start Docker Container for Stake Updater

```sh
docker build -t stake-updater ./stake_updater
docker run --rm -d --name stake-updater-container --env-file ./.env stake-updater
```

Builds and runs the Docker container for the stake updater. This container updates the database with the current staked values from the blockchain every minute. The `--rm` flag ensures the container is removed when it stops, and the `--env-file ./.env` option loads environment variables from the `.env` file.

### Stop Docker Container

```sh
docker stop stake-updater-container
```

Stops the Docker container for the stake updater. The container will be automatically removed due to the `--rm` flag used when starting it.

### Start Docker and Development Server

```sh
docker build -t stake-updater ./stake_updater
docker run --rm -d --name stake-updater-container --env-file ./.env stake-updater
bun dev
```

Starts both the Docker container for the stake updater and the development server.

### Full Setup and Start

```sh
bun install
bun db:push
docker build -t stake-updater ./stake_updater
docker run --rm -d --name stake-updater-container --env-file ./.env stake-updater
bun dev
```

Performs a complete setup: installs dependencies, sets up the database, starts the Docker container for the stake updater, and runs the development server.

### Individual Commands

You can also run these commands separately if needed:

- Install dependencies:

  ```sh
  bun install
  ```

- Set up the database:

  ```sh
  bun db:push
  ```

- Build the Docker image:

  ```sh
  docker build -t stake-updater ./stake_updater
  ```

- Run the Docker container:

  ```sh
  docker run --rm -d --name stake-updater-container --env-file ./.env stake-updater
  ```

- View Docker container logs:

  ```sh
  docker logs stake-updater-container
  ```

  To follow the logs in real-time, add the `-f` flag:

  ```sh
  docker logs -f stake-updater-container
  ```

- Stop the Docker container:

  ```sh
  docker stop stake-updater-container
  ```

- Remove the Docker container:

  ```sh
  docker rm stake-updater-container
  ```

These commands provide flexibility in managing different aspects of the project setup and execution, including monitoring the Docker container's output.

### Docker Setup for Stake Updater

The application includes a stake updater that runs in a Docker container.

Note: The stake updater in the Docker container updates the database with the "true" staked value on chain every minute. If you don't run this container, your database won't have up-to-date stake information.

## Subnet Weights Calculation

This project now calculates subnet weights directly on the front-end, providing real-time updates and a more integrated user experience.

### Calculation Logic

The subnet weights are calculated in the `SubnetWeights` component (`src/app/subnetweights/page.tsx`). Here's an overview of the calculation process:

1. The component fetches the current subnet votes and stake data using API queries.
2. It determines whether to include owner votes based on the `NEXT_PUBLIC_INCLUDE_OWNER_VOTES` environment variable.
3. The total stake is calculated, either including or excluding the remaining (unvoted) stake based on the configuration.
4. For each subnet vote, the weight is calculated as follows:
   - If owner votes are included, it combines the voted weight with a portion of the remaining stake based on the owner's vote.
   - The weight is then normalized to a percentage of the total stake.
5. The results are formatted and displayed to the user.

### Key Features

- **Real-time Calculations**: Weights are computed on-the-fly as data is fetched or updated.
- **Configurable Owner Vote Inclusion**: The system can optionally include or exclude owner votes in the calculation.
- **Percentage Formatting**: Weights are displayed as percentages with two decimal places for easy readability.

### Usage

To view and interact with the subnet weights:

1. Ensure your environment is set up correctly, including the `NEXT_PUBLIC_INCLUDE_OWNER_VOTES` variable.
2. Navigate to the subnet weights page in your browser.

The page will display the current subnet weights based on the latest data from your Supabase database and the configured calculation method.

### Customization

You can customize the weight calculation by modifying the `SubnetWeights` component in `src/app/subnetweights/page.tsx`. This allows you to adjust the calculation logic, display format, or add additional features as needed for your specific validator requirements. Manifold leaves
this decision to the Validator themselves.

### Create Vercel account and push project

Create a [vercel](https://vercel.com/) account and hookup your github to it. Add
a new project and import your forked github repo and paste in your .env file

For Testing:

1. Remember to change from your finner validator address to your test validator address
2. Change `NEXT_PUBLIC_FINNEY_ENDPOINT="wss://entrypoint-finney.opentensor.ai:443"` to `NEXT_PUBLIC_FINNEY_ENDPOINT="wss://test.finney.opentensor.ai:443/"`

### Completion

Your application should now be operational. Make sure you test everything yourself
before advertising it.

## Troubleshooting

If you encounter issues with the Docker build process, ensure that:

1. Docker is properly installed and running on your system.
2. You have sufficient permissions to build and run Docker containers.
3. Your internet connection is stable, as the build process needs to download Rust and other dependencies.

If problems persist, check the Docker build logs for more detailed error messages.

If you encounter issues with the Polkadot extension, ensure that the application has access to view your Polkadot wallet:

1. Open the Polkadot extension
1. Click the settings button in the top right
1. Click `Manage Website Access` in the bottom of the opened drawer
1. Click on the `No Accounts` button for the application that is yours. Should be `NEXT_PUBLIC_VALIDATOR_EXTENSION_ID` or your domain
1. Select your account and hit `connect`
1. Check the modal and you should see your account now

## How to Contribute

### Code Review

Manifold welcomes all PR's for the betterment of the subnet and Bittensor as a whole. We are striving for improvement at every interval and believe through open
communication and sharing of ideas will success be attainable. We are happy to help with any questions in our Discord.
