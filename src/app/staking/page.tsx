"use client";
import { useState, useEffect } from "react";
import { env } from "~/env.mjs";
import { useWalletStore } from "~/providers/wallet-store-provider";

const truncateAddress = (address: string) => {
  return `${address.slice(0, 5)}...${address.slice(-5)}`;
};

export default function Staking() {
  const [taoAmount, setTaoAmount] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);

  const connectedAccount = useWalletStore((state) => state.connectedAccount);
  const stakingBalance = useWalletStore((state) => state.stakingBalance);
  const availableBalance = useWalletStore((state) => state.availableBalance);

  useEffect(() => {
    // Check if taoAmount is not empty and is a valid number
    setIsFormValid(taoAmount !== "" && !isNaN(parseFloat(taoAmount)));
  }, [taoAmount]);

  console.log("stakingBalance", stakingBalance);
  console.log("availableBalance", availableBalance);

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
                          {stakingBalance ?? "No staked balance"} Tao (0.00$)
                        </span>
                        <button className="ml-auto rounded bg-gray-200 px-2 py-1 text-gray-700 hover:bg-gray-300">
                          MAX
                        </button>
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
                          {availableBalance ?? "No available balance"} Tao
                          (0.00$)
                        </span>
                        <button className="ml-auto rounded bg-gray-200 px-2 py-1 text-gray-700 hover:bg-gray-300">
                          MAX
                        </button>
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
                    type="submit"
                    className={`flex w-40 items-center justify-center gap-2 rounded-md border border-transparent bg-indigo-500 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-600 sm:px-8 ${
                      isFormValid ? "" : "cursor-not-allowed opacity-60"
                    }`}
                    disabled={!isFormValid}
                  >
                    Delegate
                  </button>
                  <button
                    type="submit"
                    className={`flex w-40 items-center justify-center gap-2 rounded-md border border-transparent bg-indigo-500 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-600 sm:px-8 ${
                      isFormValid ? "" : "cursor-not-allowed opacity-60"
                    }`}
                    disabled={!isFormValid}
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
