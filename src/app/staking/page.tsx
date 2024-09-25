"use client";
import { useState, useEffect } from "react";
import { env } from "~/env.mjs";
import { useWalletStore } from "~/providers/wallet-store-provider";
import { PriceServiceConnection } from "@pythnetwork/price-service-client";
import { toast } from "sonner";

const truncateAddress = (address: string) => {
  return `${address.slice(0, 5)}...${address.slice(-5)}`;
};

export default function Staking() {
  const [taoAmount, setTaoAmount] = useState("");
  const [price, setPrice] = useState(0);

  const connectedAccount = useWalletStore((state) => state.connectedAccount);
  const stakingBalance = useWalletStore((state) => state.stakingBalance);
  const availableBalance = useWalletStore((state) => state.availableBalance);
  const handleAddStake = useWalletStore((state) => state.handleAddStake);

  useEffect(() => {
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
  }, []);

  const handleDelegate = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (
      taoAmount !== "" &&
      !isNaN(parseFloat(taoAmount)) &&
      connectedAccount &&
      availableBalance &&
      taoAmount <= availableBalance
    ) {
      try {
        await handleAddStake(taoAmount);
        console.log("Delegation successful");
        toast.success("Delegation successful");
        setTaoAmount("");
      } catch (error) {
        console.error("Delegation failed:", error);
        toast.error("Delegation failed");
      }
    } else {
      toast.error("Please enter a valid amount");
    }
  };

  const handleUnDelegate = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (
      taoAmount !== "" &&
      !isNaN(parseFloat(taoAmount)) &&
      connectedAccount &&
      stakingBalance &&
      taoAmount <= stakingBalance
    ) {
      try {
        await handleAddStake(taoAmount);
        console.log("Delegation successful");
        toast.success("Delegation successful");
        setTaoAmount("");
      } catch (error) {
        console.error("Delegation failed:", error);
        toast.error("Delegation failed");
      }
    } else {
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
                          {Number(stakingBalance).toFixed(4) ??
                            "No staked balance"}{" "}
                          Tao ||{" "}
                          {price
                            ? "$" + (Number(stakingBalance) * price).toFixed(2)
                            : "Loading..."}
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
                          {Number(availableBalance).toFixed(4) ??
                            "No available balance"}{" "}
                          Tao ||{" "}
                          {price
                            ? "$" +
                              (Number(availableBalance) * price).toFixed(2)
                            : "Loading..."}
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
                    className={`flex w-40 items-center justify-center gap-2 rounded-md border border-transparent bg-indigo-500 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-600 sm:px-8 ${
                      taoAmount !== "" &&
                      !isNaN(parseFloat(taoAmount)) &&
                      connectedAccount
                        ? ""
                        : "cursor-not-allowed opacity-60"
                    }`}
                    disabled={
                      !(
                        taoAmount !== "" &&
                        !isNaN(parseFloat(taoAmount)) &&
                        connectedAccount
                      )
                    }
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                      handleDelegate(e)
                    }
                  >
                    Delegate
                  </button>
                  <button
                    className={`flex w-40 items-center justify-center gap-2 rounded-md border border-transparent bg-indigo-500 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-600 sm:px-8 ${
                      taoAmount !== "" &&
                      !isNaN(parseFloat(taoAmount)) &&
                      connectedAccount
                        ? ""
                        : "cursor-not-allowed opacity-60"
                    }`}
                    disabled={
                      !(
                        taoAmount !== "" &&
                        !isNaN(parseFloat(taoAmount)) &&
                        connectedAccount
                      )
                    }
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                      handleUnDelegate(e)
                    }
                  >
                    Undelegate
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
