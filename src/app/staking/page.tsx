"use client";
import { RocketLaunchIcon } from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";
import { env } from "~/env.mjs";
import { useWalletStore } from "~/providers/wallet-store-provider";

export default function Staking() {
  const [taoAmount, setTaoAmount] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);

  const connectedAccount = useWalletStore((state) => state.connectedAccount);

  useEffect(() => {
    // Check if taoAmount is not empty and is a valid number
    setIsFormValid(taoAmount !== "" && !isNaN(parseFloat(taoAmount)));
  }, [taoAmount]);

  return (
    <form>
      <div className="space-y-12 p-12 sm:space-y-16">
        <div>
          <h2 className="text-base font-semibold leading-7 text-gray-900">
            Delegate to {env.NEXT_PUBLIC_VALIDATOR_NAME}
          </h2>

          <div className="mt-10 space-y-8 border-b border-gray-900/10 pb-12 sm:space-y-0 sm:divide-y sm:divide-gray-900/10 sm:border-t sm:pb-0">
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label
                htmlFor="username"
                className="block font-medium leading-6 text-gray-900 sm:pt-1.5"
              >
                Validator Address:
              </label>
              <div className="mt-2 text-gray-400 sm:col-span-2 sm:mt-0">
                {env.NEXT_PUBLIC_VALIDATOR_ADDRESS}
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label
                htmlFor="about"
                className="block font-medium leading-6 text-gray-900 sm:pt-1.5"
              >
                Your Address:
              </label>
              <div className="mt-2 text-gray-400 sm:col-span-2 sm:mt-0">
                {connectedAccount}
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label
                htmlFor="about"
                className="block font-medium leading-6 text-gray-900 sm:pt-1.5"
              >
                Staked:
              </label>
              <div className="mt-2 flex items-center justify-between text-gray-400 sm:col-span-2 sm:mt-0">
                <span>0.000 Tao (0.00$)</span>
                <button className="ml-auto rounded bg-gray-200 px-2 py-1 text-gray-700 hover:bg-gray-300">
                  MAX
                </button>
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label
                htmlFor="about"
                className="block font-medium leading-6 text-gray-900 sm:pt-1.5"
              >
                Available:
              </label>
              <div className="mt-2 flex items-center justify-between text-gray-400 sm:col-span-2 sm:mt-0">
                <span>0.000 Tao (0.00$)</span>
                <button className="ml-auto rounded bg-gray-200 px-2 py-1 text-gray-700 hover:bg-gray-300">
                  MAX
                </button>
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label
                htmlFor="taoAmount"
                className="block font-medium leading-6 text-gray-900 sm:pt-1.5"
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
                  className="flex border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
          </div>
        </div>
        <button
          type="submit"
          className={`flex items-center justify-center gap-2 rounded-md border border-transparent bg-indigo-500 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-600 sm:px-8 ${
            isFormValid ? "" : "cursor-not-allowed opacity-60"
          }`}
          disabled={!isFormValid}
        >
          Stake Now! <RocketLaunchIcon className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
