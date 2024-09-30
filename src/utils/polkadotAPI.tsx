import { ApiPromise, WsProvider } from "@polkadot/api";
import { web3FromAddress } from "@polkadot/extension-dapp";
import { type AccountInfo } from "@polkadot/types/interfaces";
import { env } from "~/env.mjs";

export const isClient = typeof window !== "undefined";

let api: ApiPromise | null = null;

// Initialize Polkadot API
export const initPolkadotApi = async () => {
  if (isClient && !api) {
    const provider = new WsProvider("wss://test.finney.opentensor.ai:443/");
    api = await ApiPromise.create({ provider });
  }
  return api;
};

// Fetch balance
export const fetchBalance = async (account: string) => {
  if (!isClient) return null;

  console.log("fetchBalance function called");
  console.log("Connected account:", account);
  if (!account) {
    console.error("No account connected");
    return null;
  }

  try {
    const api = await initPolkadotApi();
    if (!api) throw new Error("Failed to initialize Polkadot API");

    console.log("Polkadot API initialized");

    const accountInfo = (await api.query.system!.account!(
      account,
    )) as AccountInfo;
    console.log("Account Info:", accountInfo);

    if (accountInfo.data.free) {
      const freeBalance = accountInfo.data.free;
      console.log("Free Balance:", freeBalance.toString());

      return {
        availableBalance: freeBalance.toString(),
      };
    } else {
      throw new Error("Account data is not available or malformed");
    }
  } catch (error) {
    console.error("Failed to fetch balance:", error);
    return null;
  }
};

// Add stake
export const addStake = async (
  account: string,
  amount: bigint,
): Promise<string | null> => {
  if (!isClient) return null;

  if (!account || !amount) {
    console.error("No account connected or balance not available");
    return null;
  }

  try {
    const api = await initPolkadotApi();
    if (!api) throw new Error("Failed to initialize Polkadot API");

    const injector = await web3FromAddress(account);
    const hotkeyAddress = env.NEXT_PUBLIC_VALIDATOR_ADDRESS;

    console.log("hotkeyAddress: ", hotkeyAddress);
    console.log("amount: ", amount);

    const customExtrinsic = api.tx.subtensorModule!.addStake!(
      hotkeyAddress,
      amount,
    );

    console.log("Custom extrinsic:", customExtrinsic);

    const txHash = await new Promise<string>((resolve, reject) => {
      void customExtrinsic.signAndSend(
        account,
        { signer: injector.signer },
        ({ status, dispatchError }) => {
          if (status.isFinalized && !dispatchError) {
            console.log(
              "Transaction finalized. Hash:",
              status.asFinalized.toString(),
            );
            resolve(status.asFinalized.toString());
          }
          if (dispatchError) {
            console.error(`Dispatch Error: ${dispatchError.toString()}`);
            reject(new Error(`Dispatch Error: ${dispatchError.toString()}`));
          }
        },
      );
    });

    console.log("Add Stake Successful");
    return txHash;
  } catch (e) {
    console.error(`Error signing and sending tx: ${e as string}`);
    return null;
  }
};

// Remove stake
export const removeStake = async (
  account: string,
  amount: bigint,
): Promise<string | null> => {
  if (!isClient) return null;

  if (!account || !amount) {
    console.error("No account connected or staking balance not available");
    return null;
  }

  try {
    const api = await initPolkadotApi();
    if (!api) throw new Error("Failed to initialize Polkadot API");

    const injector = await web3FromAddress(account);
    const hotkeyAddress = env.NEXT_PUBLIC_VALIDATOR_ADDRESS;

    console.log("hotkeyAddress: ", hotkeyAddress);
    console.log("amount: ", amount);

    const customExtrinsic = api.tx.subtensorModule!.removeStake!(
      hotkeyAddress,
      amount,
    );

    console.log("Custom extrinsic:", customExtrinsic);

    let txHash: string | null = null;
    let attempts = 0;

    while (!txHash && attempts < 4) {
      try {
        txHash = await new Promise<string>((resolve, reject) => {
          void customExtrinsic.signAndSend(
            account,
            { signer: injector.signer },
            ({ status, dispatchError }) => {
              if (status.isFinalized && !dispatchError) {
                console.log(
                  "Transaction finalized. Hash:",
                  status.asFinalized.toString(),
                );
                resolve(status.asFinalized.toString());
              }
              if (dispatchError) {
                console.error(`Dispatch Error: ${dispatchError.toString()}`);
                reject(
                  new Error(`Dispatch Error: ${dispatchError.toString()}`),
                );
              }
            },
          );
        });
      } catch (e) {
        console.error(`Error signing and sending tx: ${e as string}`);
      }
      if (!txHash) {
        attempts++;
      }
    }

    console.log("Remove Stake Successful");
    return txHash;
  } catch (e) {
    console.error(`Error in removeStake: ${e as string}`);
    return null;
  }
};
