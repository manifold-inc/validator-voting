import asyncio
from dataclasses import dataclass
import time
import os
from typing import List
from dotenv import load_dotenv
import psycopg2
import urllib.parse
import bt_decode
from substrateinterface import Keypair, SubstrateInterface
from scalecodec.utils.ss58 import ss58_encode

# Load environment variables
load_dotenv()


@dataclass
class StakeInfo:
    """Dataclass for stake info."""

    hotkey_ss58: str  # Hotkey address
    coldkey_ss58: str  # Coldkey address
    stake: int  # Stake for the hotkey-coldkey pair

    @classmethod
    def list_from_vec_u8(cls, vec_u8: bytes) -> list["StakeInfo"]:
        """
        Returns a list of StakeInfo objects from a `vec_u8`.
        """
        decoded = bt_decode.StakeInfo.decode_vec(vec_u8)
        results = []
        for d in decoded:
            hotkey = ss58_encode(bytes(d.hotkey).hex(), 42)
            coldkey = ss58_encode(bytes(d.hotkey).hex(), 42)
            stake = d.stake
            results.append(StakeInfo(hotkey, coldkey, stake))

        return results


def connect_to_database():
    # Get PostgreSQL connection details from environment variables
    DATABASE_URL = os.getenv("DATABASE_URL")
    if DATABASE_URL is None:
        print("No database url")
        exit(-1)
    # Create PostgreSQL connection
    try:
        result = urllib.parse.urlparse(DATABASE_URL.strip('"'))
        username = result.username
        password = result.password
        database = result.path[1:]
        hostname = result.hostname
        port = result.port
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


async def get_stake_to_validator(staker_ss58_address):
    subtensor = SubstrateInterface(
        ss58_format=42,
        use_remote_preset=True,
        url=os.getenv("NEXT_PUBLIC_FINNEY_ENDPOINT", "").strip('"'),
        type_registry={
            "types": {
                "Balance": "u64",  # Need to override default u128
            },
            "runtime_api": {
                "StakeInfoRuntimeApi": {
                    "methods": {
                        "get_stake_info_for_coldkey": {
                            "params": [
                                {
                                    "name": "coldkey_account_vec",
                                    "type": "Vec<u8>",
                                },
                            ],
                            "type": "Vec<u8>",
                        },
                    },
                },
            },
        },
    )
    staker_pub = Keypair(staker_ss58_address).public_key
    hex_bytes_result = subtensor.runtime_call(
        api="StakeInfoRuntimeApi",
        method="get_stake_info_for_coldkey",
        params=[staker_pub],
    )
    if len(str(hex_bytes_result.value)) == 1:
        return None
    try:
        stake_infos: List[StakeInfo] = StakeInfo.list_from_vec_u8(bytes.fromhex(hex_bytes_result.value[2:]))  # type: ignore
        for stake_info in stake_infos:
            if stake_info.hotkey_ss58 != validator_hotkey:
                continue
            return stake_info.stake
    except:
        pass
    print(f"No delegate found with hotkey: {validator_hotkey}")
    return None


async def update_stake_amounts(connection):
    cursor = connection.cursor()
    cursor.execute("""SELECT ss58 FROM account""")
    accounts = cursor.fetchall()
    print(f"Found {len(accounts)} accounts to process")
    print(f"Using validator hotkey: {validator_hotkey}")

    for [ss58] in accounts:
        print(f"\nProcessing delegation {ss58}")
        stake_rao = await get_stake_to_validator(ss58)
        if stake_rao is not None:
            print(f"Updating stake amount: {stake_rao} rao")
            cursor.execute(
                "UPDATE account SET stake = %s WHERE ss58 = %s",
                (stake_rao, ss58),
            )
        else:
            print(f"Nulling stake for delegation {ss58}: Staker not found")
            cursor.execute(
                "UPDATE account SET stake = NULL WHERE ss58 = %s",
                (ss58,),
            )
        connection.commit()
        print(f"Updated stake for delegation {ss58}")

    cursor.close()
    print("\nFinished processing all delegations")


if __name__ == "__main__":
    db = connect_to_database()
    validator_hotkey = os.getenv("NEXT_PUBLIC_VALIDATOR_ADDRESS", "").strip('"')
    while True:
        asyncio.run(update_stake_amounts(db))
        time.sleep(60 * 1)
