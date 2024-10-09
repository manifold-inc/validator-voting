# Validator Voting

The goal of the validator voting is to give delegators a simple way to directly
stake and remove stake to their validator of choice. This also provides a Supabase database
that tracks the delegators wallet and their allocation of weights across subnets so that
the Validator can make a conscious decision on their weights based off of the delegators voice. 
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
1. A modal should open up. Click on connection string, URI, and change the mode from transaction to session in the dropdown
1. Copy the connection string shown and insert your password

### 2. Copy `sample.env` to `.env`

Example: `http://1.2.3.4:80`

Fill in `DATABASE_URL` to your connection string you copied from Supabase.

Fill in `NEXT_PUBLIC_VALIDATOR_NAME` with your name as a Validator.

Fill in `NEXT_PUBLIC_VALIDATOR_ADDRESS` with your SS58 Address.

Fill in `NEXT_PUBLIC_VALIDATOR_EXTENSION_ID` with the extension that you wish Polkadot to show to your users as the application asking for access.

### 3. Setup Database / Bootstrap

Install [bun](https://bun.sh/), then run

```sh
bun db:push
```

This initializes the database schema.

### 4. Test Application

We highly recommend testing your application before deploying it. 

Replace `NEXT_PUBLIC_VALIDATOR_ADDRESS` with a Testnet Validator address.

Run 
```sh
bun dev
```

This builds your development application. Navigate to http://localhost:3000 and test your application with a Testnet wallet.

### 5. Create Vercel account and push project

Create a [vercel](https://vercel.com/) account and hookup your github to it. Add
a new project and import your forked github repo and paste in your .env file

### Completion

Your application should now be operational. Make sure you test everything yourself
before advertising it.
