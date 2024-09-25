"use client";

import { DonutChart } from "@tremor/react";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { format } from "date-fns";
import { truncateAddress } from "../staking/page";
import { PriceServiceConnection } from "@pythnetwork/price-service-client";

type Delegations = {
  connected_account: string;
  timestamp: Date;
  weights: Record<string, number>;
  stake: number | null;
};

export default function Delegators() {
  const [data, setData] = useState<Delegations[]>([]);
  const [searchAddress, setSearchAddress] = useState<string>("");
  const [price, setPrice] = useState<number>(0);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const { data: delegateData, isLoading } =
    api.delegate.getAllDelegateWeightsAndStakes.useQuery();

  useEffect(() => {
    if (delegateData) {
      const formattedData = delegateData.delegateWeightsAndStakes.map(
        (item) => ({
          ...item,
          timestamp: new Date(item.timestamp),
          weights: item.weights
            ? Object.fromEntries(
                Object.entries(item.weights).map(([key, value]) => [
                  key,
                  Number(value),
                ]),
              )
            : {},
        }),
      );
      setData(formattedData);
    }
  }, [delegateData]);

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

  const safeValueFormatter = (value: number | string) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return isNaN(num) ? "0.00%" : `${num.toFixed(2)}%`;
  };

  const filteredData = data.filter((item) =>
    item.connected_account.toLowerCase().includes(searchAddress.toLowerCase()),
  );

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

          <div className="relative flex flex-col items-center justify-center gap-2 px-6 py-2 text-center sm:py-4 lg:px-6 lg:py-12">
            <p className="text-2xl font-semibold text-white">Delegators</p>

            <input
              type="text"
              placeholder="Search by account address"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              className="mb-4 w-full max-w-md rounded-md px-4 py-2 text-black placeholder:font-mono"
            />

            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <table className="min-w-full p-4 text-white">
                <thead>
                  <tr>
                    <th className="border-b px-4 py-2">Stake</th>
                    <th className="border-b px-4 py-2">USD</th>
                    <th className="border-b px-4 py-2">Address</th>
                    <th className="border-b px-4 py-2">Last Updated</th>
                    <th className="border-b px-4 py-2">Weights</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => (
                    <>
                      <tr
                        key={index}
                        onClick={() =>
                          setExpandedRow(expandedRow === index ? null : index)
                        }
                        className="cursor-pointer hover:bg-indigo-800"
                      >
                        <td className="border-b px-4 py-2">
                          {item.stake ?? "N/A"}
                        </td>
                        <td className="border-b px-4 py-2">
                          {item.stake
                            ? `$${(item.stake * price).toFixed(2)}`
                            : "N/A"}
                        </td>
                        <td className="border-b px-4 py-2">
                          {truncateAddress(item.connected_account)}
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
                            <span className="text-sm text-gray-300">
                              No weights assigned
                            </span>
                          )}
                        </td>
                      </tr>
                      {expandedRow === index && (
                        <tr>
                          <td colSpan={5} className="border-b px-4 py-4">
                            <div className="flex flex-row items-center justify-center gap-4">
                              <div className="mt-4">
                                <h3 className="mb-2 text-lg font-semibold">
                                  Allocated Weights:
                                </h3>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
