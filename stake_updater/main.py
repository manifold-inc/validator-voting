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
import scalecodec

# Load environment variables
load_dotenv()


def decode_account_id(account_id_bytes: tuple):
    # Convert the AccountId bytes to a Base64 string
    return ss58_encode(bytes(account_id_bytes).hex(), 42)


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


@dataclass
class DelegateInfo:
    """
    Dataclass for delegate information. For a lighter version of this class, see :func:`DelegateInfoLite`.

    :param hotkey_ss58: Hotkey of the delegate for which the information is being fetched.
    :param total_stake: Total stake of the delegate.
    :param nominators: list of nominators of the delegate and their stake.
    :param take: Take of the delegate as a percentage.
    :param owner_ss58: Coldkey of the owner.
    :param registrations: list of subnets that the delegate is registered on.
    :param validator_permits: list of subnets that the delegate is allowed to validate on.
    :param return_per_1000: Return per 1000 TAO, for the delegate over a day.
    :param total_daily_return: Total daily return of the delegate.

    """

    hotkey_ss58: str  # Hotkey of delegate
    total_stake: int  # Total stake of the delegate
    nominators: list[
        tuple[str, int]
    ]  # list of nominators of the delegate and their stake
    owner_ss58: str  # Coldkey of owner
    validator_permits: list[
        int
    ]  # list of subnets that the delegate is allowed to validate on
    registrations: list[int]  # list of subnets that the delegate is registered on
    return_per_1000: int  # Return per 1000 tao of the delegate over a day
    total_daily_return: int  # Total daily return of the delegate

    @classmethod
    def from_vec_u8(cls, vec_u8: bytes):
        decoded = bt_decode.DelegateInfo.decode(vec_u8)
        hotkey = decode_account_id(decoded.delegate_ss58) #type: ignore
        owner = decode_account_id(decoded.owner_ss58)#type: ignore
        nominators = [(decode_account_id(x), (y)) for x, y in decoded.nominators]#type: ignore
        total_stake = sum((x[1] for x in nominators)) if nominators else 0
        return DelegateInfo(
            hotkey_ss58=hotkey,
            total_stake=total_stake,
            nominators=nominators,
            owner_ss58=owner,
            validator_permits=decoded.validator_permits,
            registrations=decoded.registrations,
            return_per_1000=decoded.return_per_1000,
            total_daily_return=decoded.total_daily_return,
        )


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


async def get_total_stake():
    account_id_hex: str = scalecodec.ss58_decode(validator_hotkey, 42)
    account_id_bin = bytes.fromhex(account_id_hex)
    encoded_address: list[int] = [int(byte) for byte in account_id_bin]
    json_body = subtensor.rpc_request(
        method="delegateInfo_getDelegate",
        params=[encoded_address],
    )
    if not (result := json_body.get("result", None)):
        return None
    try:
        delegate_info: DelegateInfo = DelegateInfo.from_vec_u8(bytes(result))  # type: ignore
        return delegate_info.total_stake
    except Exception as e:
        print(e)
        pass
    return 0


async def update_stake_amounts(connection):
    cursor = connection.cursor()
    cursor.execute("""SELECT ss58 FROM account""")
    accounts = cursor.fetchall()
    print(f"Found {len(accounts)} accounts to process")
    print(f"Using validator hotkey: {validator_hotkey}")

    for [ss58] in accounts:
        print(f"\nProcessing delegation {ss58}")
        stake_rao = await get_stake_to_validator(ss58)
        print(f"Updating stake amount: {stake_rao} rao")
        cursor.execute(
            "UPDATE account SET stake = %s WHERE ss58 = %s",
            (stake_rao, ss58),
        )
        connection.commit()
        print(f"Updated stake for delegation {ss58}")

    total_stake = await get_total_stake()
    cursor.execute(
        "INSERT INTO validator (ss58, stake) VALUES (%s, %s) ON CONFLICT (ss58) DO UPDATE SET stake = %s",
        (validator_hotkey, total_stake, total_stake),
    )
    cursor.close()
    print("\nFinished processing all delegations")


if __name__ == "__main__":
    db = connect_to_database()
    validator_hotkey = os.getenv("NEXT_PUBLIC_VALIDATOR_ADDRESS", "").strip('"')
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
    while True:
        asyncio.run(update_stake_amounts(db))
        time.sleep(60 * 1)
