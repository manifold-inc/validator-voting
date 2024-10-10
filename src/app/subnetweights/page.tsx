"use client";

import { api } from "~/trpc/react";
import { DonutChart } from "@tremor/react";

export default function SubnetWeights() {
  const { data, isLoading } = api.weights.getSubnetWeights.useQuery();

  const dataFormatter = (number: number) => `${number.toFixed(2)}%`;

  return (
    <div className="relative p-4">
      <div className="relative mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="relative flex flex-col items-center justify-center gap-2 py-2 text-center sm:py-4 lg:px-6 lg:py-12">
          <p className="text-2xl font-semibold text-black">Subnet Weights</p>

          {isLoading ? (
            <p className="text-black">Loading...</p>
          ) : (
            <div className="flex w-full flex-col pt-8 md:flex-row">
              {/* Table */}
              <div className="mb-8 w-full pr-4 md:mb-0 md:w-3/5">
                <div className="overflow-x-auto">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full p-4 text-black">
                      <thead className="sticky top-0 bg-white">
                        <tr>
                          <th className="w-36 border-b px-4 py-2">Subnet</th>
                          <th className="w-34 border-b px-4 py-2">
                            Avg Weight w/ Stake
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.map((item) => (
                          <tr key={item.subnet} className="hover:bg-gray-100">
                            <td className="border-b px-4 py-2">
                              {item.subnet.split(" ").pop()}
                            </td>
                            <td className="border-b px-4 py-2">
                              {item.weight.toFixed(2)} %
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Donut Chart */}
              <div className="w-full pl-4 md:w-2/5">
                <span className="block text-center font-mono text-tremor-default text-tremor-content dark:text-dark-tremor-content">
                  Subnet Weight Distribution
                </span>
                <div className="flex justify-center p-4">
                  <DonutChart
                    data={
                      data?.map((item) => ({
                        name: item.subnet,
                        value: item.weight,
                      })) ?? []
                    }
                    variant="pie"
                    valueFormatter={dataFormatter}
                    className="h-80 w-80"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
