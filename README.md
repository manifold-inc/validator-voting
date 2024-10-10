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


### 3. Setup Database / Bootstrap

Install [bun](https://bun.sh/), then run

```sh
bun i
```

to install the project dependencies, then

```sh
bun db:push
```

This initializes the database schema.

### 4. Setup Cron Job

This application supports an on chain check for delegations. Underneath the `/scripts` subfolder, you will see an onChain.py which queries
the Supabase database for the delegators hotkeys and checks on chain for their stake amount in Rao. It then updates their record in the 
database with that amount. This has been setup to run once per interval or every 72 minutes. To set up, please follow the below instructions.

1. Copy `/scripts/.env.example` to `/scripts/.env`
1. Go to your project in Supabase.
1. Click on the green Connect button near the top right of the screen
1. A modal will open up, select on Python for the navbar in the middle
1. Copy the connections including user, host, port, dbname
1. Fill these in, including your password which you should have saved earlier
1. We have provided the finney and test endpoints for you so no need to change those depending on your use case

Within the bash file, we have constructed the methodology to install the requirements, create the virtual environment and activate, and then 
create the executable and run it for every interval.

To run it:

1. Navigate to the scripts directory:

   ```sh
   cd scripts
   ```

2. Make the bash script executable:

   ```sh
   chmod +x setup_cron.sh
   ```

3. Run the setup script:

   ```sh
   ./setup_cron.sh
   ```

NOTE: If you do not run this bash script, your database will not update with the "true" staked value on chain.

### 5. Test Application

We highly recommend testing your application before deploying it.

Replace `NEXT_PUBLIC_VALIDATOR_ADDRESS` with a Testnet Validator address, then run

```sh
bun dev
```

This builds your development application. Navigate to http://localhost:3000 and test your application with a Testnet wallet.

#### Common Problem

If you created a Polkadot/Talisman wallet and your application is not finding it through the modal, follow these steps:

1. Open the Polkadot extension
1. Click the settings button in the top right
1. Click `Manage Website Access` in the bottom of the opened drawer
1. Click on the `No Accounts` button for the application that is yours. Should be `NEXT_PUBLIC_VALIDATOR_EXTENSION_ID` or your domain
1. Select your account and hit `connect`
1. Check the modal and you should see your account now

Happy Delegating :)

### 5. Create Vercel account and push project

Create a [vercel](https://vercel.com/) account and hookup your github to it. Add
a new project and import your forked github repo and paste in your .env file

### Completion

Your application should now be operational. Make sure you test everything yourself
before advertising it.

## How to Contribute

### Code Review

Manifold welcomes all PR's for the betterment of the subnet and Bittensor as a whole. We are striving for improvement at every interval and believe through open
communication and sharing of ideas will success be attainable. We are happy to help with any questions in our Discord.
