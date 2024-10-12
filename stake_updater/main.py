import asyncio
import time
import os
from dotenv import load_dotenv
import psycopg2
from bittensor_cli.src.bittensor.subtensor_interface import SubtensorInterface
import urllib.parse

# Load environment variables
load_dotenv()


def connect_to_database():
    # Get PostgreSQL connection details from environment variables
    DATABASE_URL = os.getenv("DATABASE_URL")
    if DATABASE_URL is None:
        print("No database url")
        exit(-1)
    # Create PostgreSQL connection
    try:
        result = urllib.parse.urlparse(DATABASE_URL)
        username = result.username
        password = result.password
        database = result.path[1:]
        hostname = result.hostname
        port = result.port
        print(DATABASE_URL)
        print(username, password, database, hostname, port)
        connection = psycopg2.connect(
            database=database,
            user=username,
            password=password,
            host=hostname,
            port=port,
        )
        print("Successfully connected to the database")
        return connection
    except (Exception, psycopg2.Error) as error:
        print("Error while connecting to PostgreSQL", error)
        return None


async def get_stake_to_validator(staker_ss58_address, validator_hotkey):
    subtensor = SubtensorInterface(os.getenv("NEXT_PUBLIC_FINNEY_ENDPOINT"))
    delegates = await subtensor.get_delegates()

    async def find_delegate(delegates, search_key):
        for delegate in delegates:
            if delegate.hotkey_ss58 == search_key:
                return delegate
        return None

    delegate = await find_delegate(delegates, validator_hotkey)

    if delegate:
        for nominator, stake in delegate.nominators:
            if nominator == staker_ss58_address:
                return stake.rao  # Return the rao value
        return None  # Return None if staker not found
    else:
        print(f"No delegate found with hotkey: {validator_hotkey}")
        return None


async def update_stake_amounts(connection):
    cursor = connection.cursor()
    cursor.execute("SELECT ud_nanoid, connected_account FROM user_delegation")
    delegations = cursor.fetchall()
    print(f"Found {len(delegations)} delegations to process")

    validator_hotkey = os.getenv("NEXT_PUBLIC_VALIDATOR_ADDRESS")

    print(f"Using validator hotkey: {validator_hotkey}")

    for delegation in delegations:
        delegation_id, staker_ss58_address = delegation
        print(
            f"\nProcessing delegation {delegation_id} for staker {staker_ss58_address}"
        )

        stake_rao = await get_stake_to_validator(staker_ss58_address, validator_hotkey)

        if stake_rao is not None:
            print(f"Updating stake amount: {stake_rao} rao")
            cursor.execute(
                "UPDATE user_delegation SET stake = %s WHERE ud_nanoid = %s",
                (stake_rao, delegation_id),
            )
        else:
            print(f"Nulling stake for delegation {delegation_id}: Staker not found")
            cursor.execute(
                "UPDATE user_delegation SET stake = NULL WHERE ud_nanoid = %s",
                (delegation_id,),
            )

        connection.commit()
        print(f"Updated stake for delegation {delegation_id}")

    cursor.close()
    print("\nFinished processing all delegations")


if __name__ == "__main__":
    db = connect_to_database()
    while True:
        asyncio.run(update_stake_amounts(db))
        time.sleep(60 * 1)
