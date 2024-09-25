"use client";
import { useState, useEffect } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { useWalletStore } from "~/providers/wallet-store-provider";

const subnets = Array.from({ length: 48 }, (_, i) => `Subnet ${i + 1}`);

type SubnetWeight = {
  subnet: string;
  weight: number;
};

export default function WeightsPage() {
  const [selectedSubnet, setSelectedSubnet] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [weight, setWeight] = useState("");
  const [subnetWeights, setSubnetWeights] = useState<SubnetWeight[]>([]);

  const connectedAccount = useWalletStore((state) => state.connectedAccount);

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

  const addSubnetWeight = () => {
    if (selectedSubnet && weight && Number(weight) > 0) {
      const newWeight = Number(parseFloat(weight).toFixed(2));
      const existingIndex = subnetWeights.findIndex(
        (sw) => sw.subnet === selectedSubnet,
      );

      if (existingIndex !== -1) {
        // Update existing subnet weight
        const updatedWeights = [...subnetWeights];
        updatedWeights[existingIndex]!.weight = newWeight;
        setSubnetWeights(updatedWeights);
      } else {
        // Add new subnet weight
        setSubnetWeights([
          ...subnetWeights,
          { subnet: selectedSubnet, weight: newWeight },
        ]);
      }

      setSelectedSubnet(null);
      setWeight("");
    }
  };

  const removeSubnetWeight = (subnet: string) => {
    setSubnetWeights(subnetWeights.filter((sw) => sw.subnet !== subnet));
  };

  const totalWeight = subnetWeights.reduce((sum, sw) => sum + sw.weight, 0);

  useEffect(() => {
    if (totalWeight > 100) {
      toast.error("Total weight exceeds 100%");
    }
  }, [totalWeight]);

  const applyWeightsMutation = api.delegate.addDelegateWeights.useMutation({
    onSuccess: () => {
      toast.success("Weights applied successfully");
    },
    onError: (error) => {
      toast.error(`Error applying weights: ${error.message}`);
    },
  });

  return (
    <div className="relative p-4">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden shadow-xl sm:rounded-2xl">
          <div className="absolute inset-0">
            <div
              className="h-full w-full bg-gradient-to-br from-indigo-900 via-indigo-600 to-indigo-400"
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-black opacity-30 mix-blend-multiply" />
          </div>

          <div className="relative px-6 py-2 sm:py-4 lg:px-6 lg:py-12">
            <form className="mx-auto max-w-3xl">
              <div className="space-y-6 p-6">
                <div>
                  <h2 className="font-semibold leading-7 text-white">
                    Allocate Subnet Weights with your Stake
                  </h2>
                  <p className="mt-2 text-sm text-gray-300">
                    Select the subnets where you&apos;d like to assign your
                    delegated TAO weight. The validator will incentivize subnets
                    based on every delegator&apos;s choice.
                  </p>

                  <div className="mt-10 space-y-8 border-b border-gray-300 pb-12 sm:space-y-0 sm:divide-y sm:divide-gray-300 sm:border-t sm:pb-0">
                    <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                      <label
                        htmlFor="subnet"
                        className="block font-medium leading-6 text-white sm:pt-1.5"
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
                              className="w-full rounded-md border border-gray-700 bg-white py-2 pl-3 pr-10 text-black focus:border-blue-500 focus:ring-blue-500 placeholder:font-mono"
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
                                <div className="relative cursor-default select-none px-4 py-2 text-gray-400">
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
                        className="block font-medium leading-6 text-white sm:pt-1.5"
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
                            className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-white placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
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

                <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
                  <button
                    type="button"
                    onClick={addSubnetWeight}
                    disabled={
                      !selectedSubnet ||
                      !weight ||
                      Number(weight) <= 0 ||
                      Number(weight) > 100
                    }
                    className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    Add Weight to Subnet
                  </button>
                  <p className="text-sm text-gray-300">
                    Remaining: {100 - totalWeight}%
                  </p>
                </div>

                {subnetWeights.length > 0 && (
                  <>
                    <p className="sticky top-0 text-center text-lg font-medium leading-6 text-white sm:text-left">
                      Added Subnet Weights
                    </p>
                    <ul className="max-h-32 divide-y divide-gray-300 overflow-y-auto">
                      {subnetWeights.map((item) => (
                        <li
                          key={item.subnet}
                          className="flex items-center justify-between py-2"
                        >
                          <span className="text-sm text-gray-300">
                            {item.subnet}: {item.weight}%
                          </span>
                          <button
                            onClick={() => removeSubnetWeight(item.subnet)}
                            className="text-sm text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <div>
                  <button
                    type="button"
                    disabled={totalWeight !== 100 || !connectedAccount}
                    className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => {
                      if (connectedAccount) {
                        applyWeightsMutation.mutate({
                          connected_account: connectedAccount,
                          weights: subnetWeights.map(({ subnet, weight }) => ({
                            subnet,
                            weight,
                          })),
                        });
                      } else {
                        toast.error("Please connect your wallet first");
                      }
                    }}
                  >
                    Apply Weights
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
