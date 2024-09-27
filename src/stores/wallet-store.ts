import { create } from "zustand";

// Define the wallet state
export type WalletState = {
  connectedAccount: string | null;
};

// Define the wallet actions
export type WalletActions = {
  setConnectedAccount: (account: string) => void;
  disconnectAccount: () => void;
};

// Combine state and actions into WalletStore
export type WalletStore = WalletState & WalletActions;

// Initial state for the wallet
const defaultInitState: WalletState = {
  connectedAccount: null,
};

// Create the wallet store with zustand
export const createWalletStore = (initState: WalletState = defaultInitState) =>
  create<WalletStore>((set) => ({
    ...initState,

    // Action to set the connected account
    setConnectedAccount: (account: string) => {
      set({ connectedAccount: account });
    },

    // Action to disconnect the account
    disconnectAccount: () => {
      set({ connectedAccount: null });
    },
  }));
