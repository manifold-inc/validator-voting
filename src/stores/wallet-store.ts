import { create } from "zustand";

export type WalletState = {
  connectedAccount: string | null;
};

export type WalletActions = {
  connectAccount: (account: string) => void;
  disconnectAccount: () => void;
};

export type WalletStore = WalletState & WalletActions;

export const defaultInitState: WalletState = {
  connectedAccount: null,
};

export const createWalletStore = (initState: WalletState = defaultInitState) =>
  create<WalletStore>((set) => ({
    ...initState,
    connectAccount: (account: string) => set({ connectedAccount: account }),
    disconnectAccount: () => set({ connectedAccount: null }),
  }));
