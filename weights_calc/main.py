import os
from dotenv import load_dotenv
import psycopg2
from decimal import Decimal
from collections import defaultdict


# Load environment variables
load_dotenv()

def connect_to_database():
    try:
        connection = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD")
        )
        return connection
    except (Exception, psycopg2.Error) as error:
        print("Error while connecting to PostgreSQL", error)
        return None

def get_weighted_averages(connection):
    with connection.cursor() as cursor:
        cursor.execute("""
        WITH latest_delegations AS (
          SELECT DISTINCT ON (ud.connected_account)
            uw.weights,
            ud.stake
          FROM user_delegation ud
          JOIN user_weights uw ON ud.connected_account = uw.connected_account
          WHERE uw.weights IS NOT NULL AND ud.stake IS NOT NULL
          ORDER BY ud.connected_account, ud.created_at DESC
        ),
        total_stakes AS (
          SELECT SUM(stake) as total_stake FROM latest_delegations
        )
        SELECT 
          key as subnet,
          SUM(CAST(value AS FLOAT) / 100 * stake) as weighted_sum,
          (SELECT total_stake FROM total_stakes) as total_stake,
          (SUM(CAST(value AS FLOAT) / 100 * stake) / (SELECT total_stake FROM total_stakes)) * 100 as weight
        FROM latest_delegations,
          jsonb_each_text(weights::jsonb) as w(key, value)
        GROUP BY key
        ORDER BY weight DESC;
        """)
        return cursor.fetchall()

def get_stake_no_weights(connection):
    with connection.cursor() as cursor:
        cursor.execute("""
        SELECT COALESCE(SUM(ud.stake), 0) as total_stake
        FROM user_delegation ud
        LEFT JOIN user_weights uw ON ud.connected_account = uw.connected_account
        WHERE uw.uw_nanoid IS NULL;
        """)
        return cursor.fetchone()[0]

def recalculate_weighted_averages(current_averages, new_weights, stake_no_weights):
    existing_stake = Decimal(current_averages[0][2]) if current_averages else Decimal('0')
    total_stake = existing_stake + Decimal(stake_no_weights)
    new_averages = defaultdict(Decimal)
    
    # Handle existing weights
    for subnet, weighted_sum, _, weight in current_averages:
        netuid = subnet.replace("Subnet ", "")
        new_averages[netuid] += Decimal(weight) / 100 * (existing_stake / total_stake)

    # Add new weights
    for netuid, weight in new_weights.items():
        new_weight = Decimal(weight) * (Decimal(stake_no_weights) / total_stake)
        new_averages[netuid] += new_weight
    
    return list(new_averages.items())

def main():
    connection = connect_to_database()
    if connection:
        try:
            # Get current weighted averages
            current_averages = get_weighted_averages(connection)
            
            print("Current voted weighted averages:")
            total_stake = Decimal(current_averages[0][2]) if current_averages else Decimal('0')
            for subnet, weighted_sum, _, weight in current_averages:
                print(f"{subnet}: {weight:.4f}%")
            print(f"\nStake with Weights: {total_stake / 1e9}")

            # Get stake with no weights
            stake_no_weights = get_stake_no_weights(connection)
            print(f"Stake with no weights: {stake_no_weights / 1e9 }")

            print(f"Total Stake: {(total_stake+stake_no_weights) / 1e9}")

            # Prompt user for new weights
            netuids = input("Enter netuids (comma-separated): ").split(',')
            weights = [Decimal(w) for w in input("Enter weights (comma-separated): ").split(',')]

            if abs(sum(weights) - Decimal('1')) > Decimal('0.0001'):
                raise ValueError("Weights must sum to 1")

            new_weights = dict(zip(netuids, weights))

            # Recalculate and print new weighted averages
            new_averages = recalculate_weighted_averages(current_averages, new_weights, stake_no_weights)
            
            # Sort new_averages by weight in descending order
            sorted_new_averages = sorted(new_averages, key=lambda x: int(x[0]))


            print("\nNew weighted averages to input to BTCLI:")
            print("Result netuids (comma-separated):", ",".join(netuid.replace("Subnet ", "") for netuid, _ in sorted_new_averages))
            print("Result weights (comma-separated):", ",".join(f"{weight:.4f}" for _, weight in sorted_new_averages))

        finally:
            connection.close()

if __name__ == "__main__":
    main()

