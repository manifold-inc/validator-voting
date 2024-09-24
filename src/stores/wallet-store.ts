import { create } from "zustand";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { type AccountInfo } from "@polkadot/types/interfaces";
import BN from "bn.js";

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
  const provider = new WsProvider("wss://entrypoint-finney.opentensor.ai:443");
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
        console.log("Misc frozen balance:", miscFrozen.toString());
        console.log("Fee frozen balance:", feeFrozen.toString());

        // Calculate the spendable balance
        const spendable = free.sub(BN.max(miscFrozen.sub(reserved), EDBN));
        console.log("Spendable balance:", spendable.toString()); // Log the spendable balance

        // Update the state with the calculated spendable balance
        set({ availableBalance: spendable.toString() });
        set({ stakingBalance: miscFrozen.add(feeFrozen).toString() });
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      }
    },
  }));
