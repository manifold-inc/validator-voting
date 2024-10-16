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

### 4. Install Required Tools

1. Install [just](https://github.com/casey/just#installation) if you haven't already.

2. Install [bun](https://bun.sh/) if you haven't already.

3. Install [Docker](https://docs.docker.com/get-docker/) if you haven't already.

## Available Commands

This project uses a Justfile to simplify common tasks. Here's a list of available commands and their explanations:

### View All Commands

```sh
just
```

This command lists all available commands in the Justfile.

### Setup Application

```sh
just setup
```

Installs project dependencies using Bun and sets up the database schema.

### Run Development Server

```sh
just dev
```

Starts the development server using Bun.

### Build for Production

```sh
just build
```

Builds the application for production using Bun.

### Start Docker Container

```sh
just docker-start
```

Builds and runs the Docker container for the stake updater. This container updates the database with the current staked values from the blockchain every minute.

### Stop Docker Container

```sh
just down
```

Stops and removes the Docker container for the stake updater.

### Start Docker and Development Server

```sh
just up
```

Starts both the Docker container for the stake updater and the development server.

### Full Setup and Start

```sh
just start-all
```

Performs a complete setup: installs dependencies, sets up the database, starts the Docker container, and runs the development server.

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
  docker run -d --name stake-updater-container stake-updater
  ```

- Stop the Docker container:

  ```sh
  docker stop stake-updater-container
  ```

- Remove the Docker container:

  ```sh
  docker rm stake-updater-container
  ```

These commands provide flexibility in managing different aspects of the project setup and execution. Use the `just` commands for convenience, or the individual commands for more granular control over the process.

### Docker Setup for Stake Updater

The application includes a stake updater that runs in a Docker container. To set it up:

1. Copy `/stake_updater/.env.example` to `/stake_updater/.env`
2. Fill in the `.env` file with your Supabase connection details (available in your Supabase project settings)

Note: The stake updater in the Docker container updates the database with the "true" staked value on chain every minute. If you don't run this container, your database won't have up-to-date stake information.

## Weights Calculation Script

This project includes a Python script for calculating weighted averages of subnet stakes. The script is located at `weights_calc/main.py`.

### Setup Instructions for Weights Calculation Script

1. Ensure you have Python 3.7+ installed on your system.

2. Navigate to the `weights_calc` directory in your terminal.

3. Install the required Python packages:

   ```sh
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the `weights_calc` directory with the following content:

   ```sh
   DB_HOST=your_database_host
   DB_NAME=your_database_name
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   ```

   Replace the placeholders with your actual Supabase database credentials, this should be the same as your `stake_updater/.env` sans the
   finney and test entry points

### Running the Weights Calculation Script

To run the script:

1. Ensure you're in the `weights_calc` directory.
2. Run the script using Python:

   ```sh
   python main.py
   ```

3. The script will display current weighted averages and prompt you to enter new netuids and weights.

4. After entering the new data, the script will calculate and display the new weighted averages with the unvoted stake to input into BTCLI.

### Script Functionality

- Connects to the Supabase database to retrieve current stake and weight information.
- Calculates current weighted averages for each subnet.
- Allows input of new weights for specified netuids.
- Recalculates weighted averages considering both voted stake and unvoted stake.
- Displays results in a format ready for input into BTCLI.

This script is crucial for validators to make informed decisions about weight distribution across subnets based on delegator preferences and stakes.

### Create Vercel account and push project

Create a [vercel](https://vercel.com/) account and hookup your github to it. Add
a new project and import your forked github repo and paste in your .env file

For Testing:

1. Remember to change from your finner validator address to your test validator address
2. Change `subtensor = SubtensorInterface(os.getenv("__finney_entrypoint__"))` to `subtensor = SubtensorInterface(os.getenv("__finney_test_entrypoint__"))`

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
