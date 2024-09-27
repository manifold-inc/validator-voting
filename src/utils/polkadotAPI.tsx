import { ApiPromise, WsProvider } from "@polkadot/api";
import { web3FromAddress } from "@polkadot/extension-dapp";
import { type AccountInfo } from "@polkadot/types/interfaces";
import { env } from "~/env.mjs";

// Initialize Polkadot API
export const initPolkadotApi = async () => {
  const provider = new WsProvider("wss://test.finney.opentensor.ai:443/");
  const api = await ApiPromise.create({ provider });
  return api;
};

// Fetch balance
export const fetchBalance = async (account: string) => {
        console.log("fetchBalance function called"); // Log function call
        console.log("Connected account:", account); // Log the connected account
        if (!account) {
          console.error("No account connected");
          return;
        }
  
        try {
          const api = await initPolkadotApi();
          console.log("Polkadot API initialized"); // Log API initialization
  
          // Check if connectedAccount is valid
          if (!account) {
            throw new Error("No connected account found");
          }
  
          // Query the total coldkey stake
          const totalColdkeyStake =
            await api.query.subtensorModule!.totalColdkeyStake!(account);
          console.log("Total Coldkey Stake:", totalColdkeyStake.toString());
  
          // Query the account balance
          const accountInfo = await api.query.system!.account!(account) as AccountInfo;
          console.log("Account Info:", accountInfo);
  
          // Check if accountInfo and free balance exist
          if (accountInfo.data.free) {
            const freeBalance = accountInfo.data.free;
            console.log("Free Balance:", freeBalance.toString());
  
            // Return the staking balance and available balance
            return({
              stakingBalance: totalColdkeyStake.toString(),
              availableBalance: freeBalance.toString(),
            });
          } else {
            throw new Error("Account data is not available or malformed");
          }
        } catch (error) {
          console.error("Failed to fetch balance:", error);
        }
};

// Add stake
export const addStake = async (account: string, amount: string) => {
    if (!account || !amount) {
      console.error("No account connected or balance not available");
      return false;
    }

    const api = await initPolkadotApi();
    const injector = await web3FromAddress(account);

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
        account,
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
};

// Remove stake
export const removeStake = async (account: string, amount: string) => {
    if (!account || !amount) {
      console.error("No account connected or staking balance not available");
      return false;
    }
    const api = await initPolkadotApi();
    const injector = await web3FromAddress(account);

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
        account,
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
};
