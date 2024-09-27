import { create } from "zustand";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { env } from "~/env.mjs";
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
  handleAddStake: (amount: string) => Promise<boolean>;
  handleRemoveStake: (amount: string) => Promise<boolean>;
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

        // Check if connectedAccount is valid
        if (!connectedAccount) {
          throw new Error("No connected account found");
        }

        // Query the total coldkey stake
        const totalColdkeyStake =
          await api.query.subtensorModule!.totalColdkeyStake!(connectedAccount);
        console.log("Total Coldkey Stake:", totalColdkeyStake.toString());

        // Query the account balance
        const accountInfo = await api.query.system!.account!(connectedAccount);
        console.log("Account Info:", accountInfo);

        // Check if accountInfo and free balance exist
        if (accountInfo?.data?.free) {
          const freeBalance = accountInfo.data.free;
          console.log("Free Balance:", freeBalance.toString());

          // Set the state with both the staking balance and available balance
          set({
            stakingBalance: totalColdkeyStake.toString(),
            availableBalance: freeBalance.toString(),
          });
        } else {
          throw new Error("Account data is not available or malformed");
        }
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      }
    },

    // Action to add stake
    handleAddStake: async (amount: string): Promise<boolean> => {
      const { connectedAccount, availableBalance } = get();
      if (!connectedAccount || !availableBalance) {
        console.error("No account connected or balance not available");
        return false;
      }

      const api = await initPolkadotApi();
      const injector = await web3FromAddress(connectedAccount);

      const hotkeyAddress = env.NEXT_PUBLIC_VALIDATOR_ADDRESS;
      const amountU64 = parseFloat(amount) * 1e9;

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

        return true;
      } catch (error) {
        console.error("Failed to add stake:", error);
        return false;
      }
    },

    // Action to remove stake
    handleRemoveStake: async (amount: string): Promise<boolean> => {
      const { connectedAccount, stakingBalance } = get();
      if (!connectedAccount || !stakingBalance) {
        console.error("No account connected or staking balance not available");
        return false;
      }
      const api = await initPolkadotApi();
      const injector = await web3FromAddress(connectedAccount);

      const hotkeyAddress = env.NEXT_PUBLIC_VALIDATOR_ADDRESS;
      const amountU64 = parseFloat(amount) * 1e9;

      console.log("hotkeyAddress: ", hotkeyAddress);
      console.log("amountU64: ", amountU64);

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

        return true;
      } catch (error) {
        console.error("Failed to remove stake:", error);
        return false;
      }
    },
  }));
