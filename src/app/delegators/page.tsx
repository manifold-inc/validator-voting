"use client";

import { DonutChart } from "@tremor/react";
import { useState } from "react";
import { api } from "~/trpc/react";
import { format } from "date-fns";
import { truncateAddress } from "~/utils/utils";
import { useQuery } from "@tanstack/react-query";
import { fetchPrice } from "~/utils/fetchPrice";

export default function Delegators() {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [searchAddress, setSearchAddress] = useState<string>("");
  const { data: pythPrice } = useQuery({
    queryKey: ["fetch.pyth.price"],
    queryFn: fetchPrice,
  });
  const { data, isLoading } =
    api.delegate.getAllDelegateWeightsAndStakes.useQuery();

  const safeValueFormatter = (value: number | string) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return isNaN(num) ? "0.00%" : `${num.toFixed(2)}%`;
  };

  const filteredData =
    data?.filter((item) =>
      item.ss58.toLowerCase().includes(searchAddress.toLowerCase()),
    ) ?? [];
  const price = pythPrice ?? 0;
  return (
    <div className="relative p-4">
      <div className="relative mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="relative flex flex-col items-center justify-center gap-2 py-2 text-center sm:py-4 lg:px-6 lg:py-12">
          <p className="text-2xl font-semibold text-black">Delegators</p>

          <input
            type="text"
            placeholder="Search by account address"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            className="flex w-fit rounded-md border-0 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 sm:text-sm"
          />

          {isLoading ? (
            <p className="text-black">Loading...</p>
          ) : (
            <div className="w-full overflow-scroll pt-8">
              <table className="min-w-full p-4 text-black">
                <thead>
                  <tr>
                    <th className="w-36 border-b px-4 py-2">Stake</th>
                    <th className="w-36 border-b px-4 py-2">USD</th>
                    <th className="w-36 border-b px-4 py-2">Address</th>
                    <th className="w-36 border-b px-4 py-2">Last Updated</th>
                    <th className="w-36 border-b px-4 py-2">Weights</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => (
                    <>
                      <tr
                        key={item.ss58}
                        onClick={() =>
                          Object.keys(item.weights).length > 0
                            ? setExpandedRow(
                              expandedRow === index ? null : index,
                            )
                            : null
                        }
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        <td className="border-b px-4 py-2">
                          {Number(item.stake!) / 1e9} τ
                        </td>
                        <td className="border-b px-4 py-2">
                          ${((Number(item.stake!) / 1e9) * price).toFixed(2)}
                        </td>
                        <td className="border-b px-4 py-2 font-mono">
                          {truncateAddress(item.ss58)}
                        </td>
                        <td className="border-b px-4 py-2">
                          {format(item.timestamp, "yyyy-MM-dd HH:mm:ss")}
                        </td>
                        <td className="flex items-center justify-center border-b px-4 py-2">
                          {Object.keys(item.weights).length > 0 ? (
                            <DonutChart
                              data={Object.entries(item.weights).map(
                                ([key, value]) => ({
                                  name: key,
                                  value: Number(value),
                                }),
                              )}
                              category="value"
                              index="name"
                              showLabel={false}
                              className="h-20 w-20"
                              valueFormatter={safeValueFormatter}
                              showTooltip={false}
                              colors={[
                                "lime",
                                "slate",
                                "indigo",
                                "violet",
                                "cyan",
                                "amber",
                                "emerald",
                                "teal",
                                "yellow",
                                "orange",
                                "red",
                              ]}
                            />
                          ) : (
                            <span className="px-4 py-3 text-sm text-gray-700">
                              No weights assigned
                            </span>
                          )}
                        </td>
                      </tr>
                      {expandedRow === index &&
                        Object.keys(item.weights).length > 0 && (
                          <tr>
                            <td colSpan={5} className="border-b px-4 py-4">
                              <div className="flex flex-row items-center justify-center gap-4">
                                <div className="mt-4">
                                  <p className="mb-2 text-lg font-semibold">
                                    Allocated Weights:
                                  </p>
                                  <ul>
                                    {Object.entries(item.weights).map(
                                      ([key, value], idx) => (
                                        <li key={idx} className="mb-1">
                                          {key}: {safeValueFormatter(value)}
                                        </li>
                                      ),
                                    )}
                                  </ul>
                                </div>
                                <DonutChart
                                  data={Object.entries(item.weights).map(
                                    ([key, value]) => ({
                                      name: key,
                                      value: Number(value),
                                    }),
                                  )}
                                  category="value"
                                  index="name"
                                  valueFormatter={safeValueFormatter}
                                  className="mb-4 h-64 w-64"
                                  colors={[
                                    "lime",
                                    "slate",
                                    "indigo",
                                    "violet",
                                    "cyan",
                                    "amber",
                                    "emerald",
                                    "teal",
                                    "yellow",
                                    "orange",
                                    "red",
                                  ]}
                                />
                              </div>
                            </td>
                          </tr>
                        )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
