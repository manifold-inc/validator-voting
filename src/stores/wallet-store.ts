import { create } from "zustand";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { type AccountInfo } from "@polkadot/types/interfaces";
import BN from "bn.js";
import { web3FromAddress } from "@polkadot/extension-dapp";

// Define the wallet state with account and balance
export type WalletState = {
  connectedAccount: string | null;
  availableBalance: string | null; // Add available balance to the state
  stakingBalance: string | null; // Add staking balance to the state
};

// Define the wallet actions
export type WalletActions = {
  connectAccount: (account: string) => void;
  disconnectAccount: () => void;
  fetchBalance: () => Promise<void>; // Add action to fetch balance
  handleAddStake: (amount: string) => Promise<void>;
  handleRemoveStake: (amount: string) => Promise<void>;
};

// Combine state and actions into WalletStore
export type WalletStore = WalletState & WalletActions;

// Initial state for the wallet
export const defaultInitState: WalletState = {
  connectedAccount: null,
  availableBalance: null, // Initial available balance set to null
  stakingBalance: null, // Initial staking balance set to null
};

// Helper function to initialize the Polkadot API
export const initPolkadotApi = async () => {
  const provider = new WsProvider("wss://test.finney.opentensor.ai:443/");
  const api = await ApiPromise.create({ provider });
  return api;
};

// Create the wallet store with zustand
export const createWalletStore = (initState: WalletState = defaultInitState) =>
  create<WalletStore>((set, get) => ({
    ...initState,
    // Action to connect the account
    connectAccount: (account: string) => {
      set({ connectedAccount: account });
      void get().fetchBalance();
    },

    // Action to disconnect the account
    disconnectAccount: () =>
      set({
        connectedAccount: null,
        availableBalance: null,
        stakingBalance: null,
      }),

    // Action to fetch the balance
    fetchBalance: async () => {
      console.log("fetchBalance function called"); // Log function call
      const { connectedAccount } = get();
      console.log("Connected account:", connectedAccount); // Log the connected account
      if (!connectedAccount) {
        console.error("No account connected");
        return;
      }

      try {
        const api = await initPolkadotApi();
        console.log("Polkadot API initialized"); // Log API initialization

        if (!api?.query?.system?.account) {
          console.error("Polkadot API is not properly initialized");
          return;
        }

        // Fetch the existential deposit (ED) for Bittensor
        const ED = api.consts.balances?.existentialDeposit;
        const EDBN = new BN(ED?.toString() ?? "0");
        console.log("Existential Deposit (ED):", ED?.toHuman());

        // Cast the result to the correct type
        const { data: balance } = (await api.query.system.account(
          connectedAccount,
        )) as AccountInfo;
        console.log("Fetched balance data:", balance); // Log the fetched balance data
        const { free, reserved, miscFrozen, feeFrozen } = balance;
        console.log("Free balance:", free.toString());
        console.log("Reserved balance:", reserved.toString());
        console.log(
          "Misc frozen balance:",
          miscFrozen ? miscFrozen.toString() : "none",
        );
        console.log(
          "Fee frozen balance:",
          feeFrozen ? feeFrozen.toString() : "none",
        );

        // Ensure miscFrozen and reserved are defined before using them
        const miscFrozenBN = miscFrozen
          ? new BN(miscFrozen.toString())
          : new BN(0);
        const feeFrozenBN = feeFrozen
          ? new BN(feeFrozen.toString())
          : new BN(0);

        // Calculate the spendable balance
        const spendable = free.sub(BN.max(miscFrozenBN.sub(reserved), EDBN));
        console.log("Spendable balance:", spendable.toString()); // Log the spendable balance

        // Update the state with the calculated spendable balance
        set({ availableBalance: (spendable.toNumber() / 1e9).toString() });
        set({
          stakingBalance: (
            miscFrozenBN.add(feeFrozenBN).toNumber() / 1e9
          ).toString(),
        });
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      }
    },

    // Action to add stake
    handleAddStake: async (amount: string) => {
      const { connectedAccount, availableBalance } = get();
      if (!connectedAccount || !availableBalance) {
        console.error("No account connected or balance not available");
        return;
      }

      const api = await initPolkadotApi();
      const injector = await web3FromAddress(connectedAccount);

      const hotkeyAddress = process.env.NEXT_PUBLIC_HOTKEY_ADDRESS;
      const amountU64 = BigInt(Math.floor(parseFloat(amount) * 1e9));

      console.log("hotkeyAddress: ", hotkeyAddress);
      console.log("amountU64: ", amountU64);

      const customExtrinsic = api.tx.subtensorModule!.addStake!(
        hotkeyAddress,
        amountU64,
      );

      console.log("Custom extrinsic:", customExtrinsic);

      try {
        console.log("signAndSend");
        await customExtrinsic.signAndSend(
          connectedAccount,
          {
            signer: injector.signer,
          },
          ({ events = [], status }) => {
            console.log("Extrinsic status:", status.type);

            if (status.isInBlock) {
              console.log(
                "Included at block hash:",
                status.asInBlock.toHuman(),
              );
              console.log("Extrinsic events: ");
              events.forEach(({ event: { data, method, section }, phase }) => {
                console.log(
                  "\t",
                  phase.toString(),
                  `: ${section}.${method}`,
                  data.toString(),
                );
              });
            } else {
              console.log("Current status:", status.type);
            }
          },
        );
      } catch (error) {
        console.error("Failed to add stake:", error);
      }
    },

    // Action to remove stake
    handleRemoveStake: async (amount: string) => {
      const { connectedAccount, stakingBalance } = get();
      if (!connectedAccount || !stakingBalance) {
        console.error("No account connected or staking balance not available");
        return;
      }
      const api = await initPolkadotApi();
      const injector = await web3FromAddress(connectedAccount);

      const hotkeyAddress = process.env.NEXT_PUBLIC_HOTKEY_ADDRESS;
      const amountU64 = BigInt(Math.floor(parseFloat(amount) * 1e9));

      const customExtrinsic = api.tx.subtensorModule!.removeStake!(
        hotkeyAddress,
        amountU64,
      );

      console.log("Custom extrinsic:", customExtrinsic);

      try {
        console.log("signAndSend");
        await customExtrinsic.signAndSend(
          connectedAccount,
          {
            signer: injector.signer,
          },
          ({ events = [], status }) => {
            console.log("Extrinsic status:", status.type);

            if (status.isInBlock) {
              console.log(
                "Included at block hash:",
                status.asInBlock.toHuman(),
              );
              console.log("Extrinsic events: ");
              events.forEach(({ event: { data, method, section }, phase }) => {
                console.log(
                  "\t",
                  phase.toString(),
                  `: ${section}.${method}`,
                  data.toString(),
                );
              });
            } else {
              console.log("Current status:", status.type);
            }
          },
        );
      } catch (error) {
        console.error("Failed to add stake:", error);
      }
    },
  }));
