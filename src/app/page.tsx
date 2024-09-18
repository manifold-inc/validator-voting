"use client";
import Link from "next/link";
import {
  RocketLaunchIcon,
  UsersIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

type Subnet = {
  subnet: number;
  weight: number;
};

const data: Subnet[] = [
  { subnet: 39, weight: 19.28 },
  { subnet: 14, weight: 15.36 },
  { subnet: 2, weight: 14.65 },
  // ... Add all other subnets here
  { subnet: 41, weight: 0.0 },
];
const columnHelper = createColumnHelper<Subnet>();

const columns = [
  columnHelper.accessor("subnet", {
    cell: (info) => `Subnet ${info.getValue()}`,
    header: () => "Subnet",
  }),
  columnHelper.accessor("weight", {
    cell: (info) => `${info.getValue().toFixed(2)}%`,
    header: () => "Weight",
  }),
];

export default function HomePage() {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <main className="flex flex-col justify-between gap-2 p-2 font-mono">
      <div className="flex flex-col justify-between rounded-md border border-black p-2">
        <p className="text-md">Make your Tao work for you</p>
        <p className="py-4 text-sm">
          Delegate to earn rewards while supporting your chosen subnets.
        </p>
        <p className="py-2 text-sm">You decide which subnets to incentivize!</p>
        <p className="pb-4 pt-2 text-sm">
          Giving power back to the delegators.
        </p>
        <Link
          href="/stake"
          className="flex w-fit items-center gap-2 rounded-md bg-black p-2 text-white"
        >
          Stake Tao
          <RocketLaunchIcon className="h-4 w-4" />
        </Link>
      </div>
      <div className="flex flex-col justify-between gap-2 rounded-md border border-black p-2">
        <p className="text-md">Validator Details </p>
        <p className="text-sm">
          Hotkey: <span className="font-mono text-gray-500"> hotkey..</span>
        </p>
        <p className="text-sm">
          Coldkey: <span className="font-mono text-gray-500"> coldkey..</span>
        </p>
        <p className="text-sm">
          Stake: <span className="font-mono text-gray-500"> Stake..</span>
        </p>
        <p className="text-sm">
          Daily Rewards:{" "}
          <span className="font-mono text-gray-500"> Daily Rewards..</span>
        </p>
        <p className="text-sm">
          Subnet Registrations:{" "}
          <span className="font-mono text-gray-500">
            {" "}
            Subnet Registrations..
          </span>
        </p>
        <p className="text-sm">
          Base Fee: <span className="font-mono text-gray-500"> Base fee..</span>{" "}
          <span className="text-black">Voter Fee:</span>
          <span className="font-mono text-gray-500"> voter fee...</span>
        </p>
        <p className="text-sm">
          Base APY: <span className="font-mono text-gray-500"> Base apy..</span>{" "}
          <span className="text-black">Voter APY:</span>
          <span className="font-mono text-gray-500"> voter apy...</span>
        </p>
        <p className="text-sm">
          Delagtors:{" "}
          <span className="font-mono text-gray-500"> delgators..</span>{" "}
          <span className="text-black">Voters:</span>
          <span className="font-mono text-gray-500"> voters...</span>
        </p>
        <p className="text-sm">
          Updated At:{" "}
          <span className="font-mono text-gray-500"> updated at....</span>
        </p>
        <Link
          href="/delegators"
          className="flex w-fit items-center gap-2 rounded-md bg-black p-2 text-white"
        >
          Delagators
          <UsersIcon className="h-4 w-4" />
        </Link>
      </div>
      <div className="flex flex-col justify-between gap-2 rounded-md border border-black p-2">
        <p className="text-md">Validator&apos;s Voted Subnet Weights</p>
        <div className="overflow-y-auto">
          <table className="w-1/3 divide-y divide-black text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-2 py-1 text-left">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-black">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-2 py-1">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link
          href="/weights"
          className="flex w-fit items-center gap-2 rounded-md bg-black p-2 text-white"
        >
          Manage Your Weights
          <ScaleIcon className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
