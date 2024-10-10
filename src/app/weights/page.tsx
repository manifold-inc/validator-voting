"use client";
import { useState } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/react";
import { api } from "~/trpc/react";
import { useWalletStore } from "~/providers/wallet-store-provider";
import AccountWeights from "../_components/accountWeights";
import NoAccountWeights from "../_components/noAccountWeights";

const subnets = Array.from({ length: 52 }, (_, i) => `Subnet ${i + 1}`);

export default function WeightsPage() {
  const [selectedSubnet, setSelectedSubnet] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [weight, setWeight] = useState("");
  const connectedAccount = useWalletStore((state) => state.connectedAccount);

  const { data: accountWeights, isLoading } =
    api.weights.getDelegateSubnetWeights.useQuery(
      {
        connected_account: connectedAccount ?? "",
      },
      {
        enabled: !!connectedAccount,
      },
    );

  const filteredSubnets =
    query === ""
      ? subnets
      : subnets.filter((subnet) =>
          subnet.toLowerCase().includes(query.toLowerCase()),
        );

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*(\.\d{0,2})?$/.test(value) && Number(value) <= 100) {
      setWeight(value);
    }
  };

  return (
    <div className="relative p-4">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden">
          <div className="relative px-6 py-2 sm:py-4 lg:px-6 lg:py-12">
            <form className="mx-auto max-w-3xl">
              <div className="space-y-6 p-6">
                <div>
                  <h2 className="font-semibold leading-7">
                    Allocate Subnet Weights with your Stake
                  </h2>
                  <p className="mt-2 text-sm text-gray-700">
                    Select the subnets where you&apos;d like to assign your
                    delegated TAO weight. The validator will incentivize subnets
                    based on every delegator&apos;s choice.
                  </p>

                  <div className="mt-10 space-y-8 border-b border-gray-300 pb-12 sm:space-y-0 sm:divide-y sm:divide-gray-300 sm:border-t sm:pb-0">
                    <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                      <label
                        htmlFor="subnet"
                        className="block font-medium leading-6 text-black sm:pt-1.5"
                      >
                        Subnet
                      </label>
                      <div className="mt-2 sm:col-span-2 sm:mt-0">
                        <Combobox
                          value={selectedSubnet}
                          onChange={setSelectedSubnet}
                        >
                          <div className="relative w-full">
                            <ComboboxInput
                              className="w-full rounded-md border border-gray-700 bg-white py-2 pl-3 pr-10 text-black placeholder:font-mono focus:border-blue-500 focus:ring-blue-500"
                              onChange={(e) => setQuery(e.target.value)}
                              placeholder="Select subnet"
                            />
                            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-black"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.292 7.707a1 1 0 011.414 0L10 10.293l3.293-2.586a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </ComboboxButton>
                          </div>

                          <div className="relative w-full">
                            <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-700 bg-white text-black shadow-lg">
                              {filteredSubnets.length === 0 ? (
                                <div className="relative cursor-default select-none px-4 py-2 text-gray-600">
                                  No results found.
                                </div>
                              ) : (
                                filteredSubnets.map((subnet) => (
                                  <ComboboxOption
                                    key={subnet}
                                    value={subnet}
                                    className={({ selected }) =>
                                      `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                        selected
                                          ? "bg-blue-100 text-blue-900"
                                          : "text-black"
                                      }`
                                    }
                                  >
                                    {({ selected }) => (
                                      <>
                                        <span
                                          className={`block truncate ${
                                            selected
                                              ? "font-semibold"
                                              : "font-normal"
                                          }`}
                                        >
                                          {subnet}
                                        </span>
                                        {selected && (
                                          <span
                                            className={`absolute inset-y-0 left-0 flex items-center pl-3`}
                                          >
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              className="h-5 w-5"
                                              viewBox="0 0 20 20"
                                              fill="currentColor"
                                            >
                                              <path
                                                fillRule="evenodd"
                                                d="M16.707 7.293a1 1 0 00-1.414 0L9 13.586l-2.293-2.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z"
                                                clipRule="evenodd"
                                              />
                                            </svg>
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </ComboboxOption>
                                ))
                              )}
                            </ComboboxOptions>
                          </div>
                        </Combobox>
                      </div>
                    </div>

                    <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                      <label
                        htmlFor="weight"
                        className="block font-medium leading-6 text-black sm:pt-1.5"
                      >
                        Weight
                      </label>
                      <div className="mt-2 sm:col-span-2 sm:mt-0">
                        <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600">
                          <input
                            type="text"
                            name="weight"
                            id="weight"
                            value={weight}
                            onChange={handleWeightChange}
                            className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-black placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                            placeholder="0.00"
                          />
                          <span className="flex select-none items-center pr-3 text-gray-500 sm:text-sm">
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {accountWeights ? (
                  <AccountWeights
                    accountWeights={accountWeights}
                    isLoading={isLoading}
                    connectedAccount={connectedAccount!}
                    subnet={selectedSubnet!}
                    weight={weight}
                    setSelectedSubnet={setSelectedSubnet}
                    setWeight={setWeight}
                  />
                ) : (
                  <NoAccountWeights
                    connectedAccount={connectedAccount}
                    selectedSubnet={selectedSubnet}
                    weight={weight}
                    setSelectedSubnet={setSelectedSubnet}
                    setWeight={setWeight}
                  />
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
