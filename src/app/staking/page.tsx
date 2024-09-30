"use client";
import { useState, useEffect } from "react";
import { env } from "~/env.mjs";
import { useWalletStore } from "~/providers/wallet-store-provider";
import { PriceServiceConnection } from "@pythnetwork/price-service-client";
import { toast } from "sonner";
import { truncateAddress } from "~/utils/utils";
import { api } from "~/trpc/react";

export default function Staking() {
  const [taoAmount, setTaoAmount] = useState<string>("");
  const [price, setPrice] = useState(0);
  const [stakingBalance, setStakingBalance] = useState<bigint | null>(null);
  const [availableBalance, setAvailableBalance] = useState<bigint | null>(null);
  const [isDelegating, setIsDelegating] = useState<boolean>(false);
  const [isUndelegating, setIsUndelegating] = useState<boolean>(false);

  const connectedAccount = useWalletStore((state) => state.connectedAccount);

  useEffect(() => {
    if (!connectedAccount) return;
    const fetchPrice = async () => {
      try {
        const connection = new PriceServiceConnection(
          "https://hermes.pyth.network",
        );

        const priceID = [
          "0x410f41de235f2db824e562ea7ab2d3d3d4ff048316c61d629c0b93f58584e1af",
        ];
        const currentPrices = await connection.getLatestPriceFeeds(priceID);

        setPrice(
          currentPrices?.[0]?.getPriceUnchecked().getPriceAsNumberUnchecked() ??
            0,
        );
      } catch (err) {
        console.error("Error fetching tao price:", err);
      }
    };

    void fetchPrice();
  }, [connectedAccount]);

  useEffect(() => {
    if (!connectedAccount) return;
    const updateBalances = async () => {
      const { fetchBalance } = await import("~/utils/polkadotAPI");
      const balances = await fetchBalance(connectedAccount);
      setAvailableBalance(BigInt(balances!.availableBalance));
    };

    void updateBalances();
  }, [connectedAccount]);

  const { data: stakeData, refetch: refetchStake } =
    api.delegate.getDelegateStake.useQuery(
      { connected_account: connectedAccount ?? "" },
      { enabled: !!connectedAccount },
    );

  useEffect(() => {
    if (stakeData) {
      setStakingBalance(stakeData.stake);
    }
  }, [stakeData]);

  const applyStakeMutation = api.delegate.addDelegateStake.useMutation({
    onMutate: (variables) => {
      console.log("Mutation variables: ", {
        ...variables,
      });
      console.log("Stake type: ", typeof variables.stake);
    },
    onSuccess: () => {
      setTaoAmount("");
      void refetchStake();
    },
    onError: (error) => {
      toast.error(`Error applying stake to DB: ${error.message}`);
    },
  });

  const handleDelegation = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDelegating(true);
    console.log("Adding stake amount: ", taoAmount);
    console.log("Available balance:", availableBalance);

    const taoAmountBigInt = BigInt(Math.floor(parseFloat(taoAmount) * 1e9));

    if (taoAmountBigInt <= availableBalance!) {
      try {
        const { addStake, fetchBalance } = await import("~/utils/polkadotAPI");
        const txHash = await addStake(connectedAccount!, taoAmountBigInt);
        if (txHash) {
          toast.success(
            `Stake added successfully. Transaction hash: ${txHash}`,
          );
          applyStakeMutation.mutate({
            connected_account: connectedAccount!,
            stake: taoAmountBigInt,
            txHash: txHash,
          });
          const newBalances = await fetchBalance(connectedAccount!);
          setAvailableBalance(BigInt(newBalances!.availableBalance));
        } else {
          toast.error("Failed to add stake.");
        }
      } catch (error) {
        console.error("Adding Stake error: ", error);
        toast.error(
          `Adding Stake error: ${error instanceof Error ? error.message : String(error)}`,
        );
      } finally {
        setIsDelegating(false);
      }
    } else {
      console.log("Validation failed:");
      console.log("Entered amount:", taoAmountBigInt.toString());
      console.log("Available amount:", availableBalance?.toString());
      setIsDelegating(false);
      toast.error("Please enter a valid amount");
    }
  };

  const handleUnDelegation = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsUndelegating(true);
    console.log("Undelagating stake amount: ", taoAmount);
    console.log("Staked balance:", stakingBalance);

    const taoAmountBigInt = BigInt(Math.floor(parseFloat(taoAmount) * 1e9));

    if (taoAmountBigInt <= stakingBalance!) {
      try {
        const { removeStake, fetchBalance } = await import(
          "~/utils/polkadotAPI"
        );
        const txHash = await removeStake(connectedAccount!, taoAmountBigInt);
        if (txHash) {
          toast.success(
            `Stake added successfully. Transaction hash: ${txHash}`,
          );
          applyStakeMutation.mutate({
            connected_account: connectedAccount!,
            stake: stakingBalance! - taoAmountBigInt,
            txHash: txHash,
          });
          const newBalances = await fetchBalance(connectedAccount!);
          setAvailableBalance(BigInt(newBalances!.availableBalance));
        } else {
          toast.error("Failed to undelegate stake.");
        }
      } catch (error) {
        console.error("Removing Stake error: ", error);
        toast.error(
          `Removing error: ${error instanceof Error ? error.message : String(error)}`,
        );
      } finally {
        setIsUndelegating(false);
      }
    } else {
      console.log("Validation failed:");
      console.log("Entered amount:", taoAmountBigInt.toString());
      console.log("Available amount:", availableBalance?.toString());
      setIsUndelegating(false);
      toast.error("Please enter a valid amount");
    }
  };

  return (
    <div className="relative p-4">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Form container with gradient background */}
        <div className="relative overflow-hidden shadow-xl sm:rounded-2xl">
          {/* Gradient background on the form */}
          <div className="absolute inset-0">
            <div
              className="h-full w-full bg-gradient-to-br from-indigo-900 via-indigo-600 to-indigo-400"
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-black opacity-30 mix-blend-multiply" />
          </div>

          {/* Form content */}
          <div className="relative px-6 py-2 sm:py-4 lg:px-6 lg:py-12">
            <form className="mx-auto max-w-3xl">
              <div className="space-y-6 p-6 sm:space-y-16">
                <div>
                  <h2 className="font-semibold leading-7 text-white">
                    Delegate to {env.NEXT_PUBLIC_VALIDATOR_NAME}
                  </h2>

                  <div className="mt-10 space-y-8 border-b border-gray-300 pb-12 sm:space-y-0 sm:divide-y sm:divide-gray-300 sm:border-t sm:pb-0">
                    <div className="sm:grid sm:grid-cols-3 sm:items-center sm:gap-4 sm:py-6">
                      <label
                        htmlFor="validatorAddress"
                        className="block font-medium leading-6 text-white sm:pt-1.5"
                      >
                        Validator Address:
                      </label>
                      <span className="mt-2 text-gray-200 sm:col-span-2 sm:mt-0">
                        <span className="hidden sm:inline">
                          {env.NEXT_PUBLIC_VALIDATOR_ADDRESS}
                        </span>
                        <span className="inline sm:hidden">
                          {truncateAddress(env.NEXT_PUBLIC_VALIDATOR_ADDRESS)}
                        </span>
                      </span>
                    </div>

                    <div className="sm:grid sm:grid-cols-3 sm:items-center sm:gap-4 sm:py-6">
                      <label
                        htmlFor="yourAddress"
                        className="block font-medium leading-6 text-white sm:pt-1.5"
                      >
                        Your Address:
                      </label>
                      <span className="mt-2 text-gray-200 sm:col-span-2 sm:mt-0">
                        <span className="hidden sm:inline">
                          {connectedAccount}
                        </span>
                        <span className="inline sm:hidden">
                          {connectedAccount &&
                            truncateAddress(connectedAccount)}
                        </span>
                      </span>
                    </div>

                    <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                      <label
                        htmlFor="staked"
                        className="block font-medium leading-6 text-white sm:pt-1.5"
                      >
                        Staked:
                      </label>
                      <div className="mt-2 flex items-center justify-between text-gray-200 sm:col-span-2 sm:mt-0">
                        <span>
                          {stakingBalance
                            ? `${(Number(stakingBalance) / 1e9).toFixed(4)} Tao || $${((Number(stakingBalance) / 1e9) * price).toFixed(2)}`
                            : "No staked balance"}
                        </span>
                      </div>
                    </div>

                    <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                      <label
                        htmlFor="available"
                        className="block font-medium leading-6 text-white sm:pt-1.5"
                      >
                        Available:
                      </label>
                      <div className="mt-2 flex items-center justify-between text-gray-200 sm:col-span-2 sm:mt-0">
                        <span>
                          {availableBalance
                            ? `${(Number(availableBalance) / 1e9).toFixed(4)} Tao || $${((Number(availableBalance) / 1e9) * price).toFixed(2)}`
                            : "No available balance"}
                        </span>
                      </div>
                    </div>

                    <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                      <label
                        htmlFor="taoAmount"
                        className="block font-medium leading-6 text-white sm:pt-1.5"
                      >
                        Tao Amount:
                      </label>
                      <div className="mt-2 flex items-center sm:col-span-2 sm:mt-0">
                        <input
                          id="taoAmount"
                          name="Tao Amount"
                          type="text"
                          placeholder="0.00"
                          value={taoAmount}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\$/g, "");
                            if (/^\d*\.?\d*$/.test(value) || value === "") {
                              setTaoAmount(value);
                            }
                          }}
                          className="flex rounded border border-gray-200 bg-transparent py-1.5 pl-1 text-white placeholder:text-gray-200 focus:ring-0 sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center gap-4">
                  <button
                    className="flex w-40 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-transparent bg-indigo-500 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-600 sm:px-8"
                    disabled={!connectedAccount || !taoAmount || isDelegating}
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                      handleDelegation(e)
                    }
                  >
                    {isDelegating ? (
                      <>
                        <span className="mr-2">
                          <svg
                            className="h-5 w-5 animate-spin text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        </span>
                        Delegating...
                      </>
                    ) : (
                      "Delegate"
                    )}
                  </button>
                  <button
                    className="flex w-40 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-transparent bg-indigo-500 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-600 sm:px-8"
                    disabled={!connectedAccount || !taoAmount || isUndelegating}
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                      handleUnDelegation(e)
                    }
                  >
                    {isUndelegating ? (
                      <>
                        <span className="mr-2">
                          <svg
                            className="h-5 w-5 animate-spin text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        </span>
                        Undelegating...
                      </>
                    ) : (
                      "Undelegate"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
