"use client";
import Link from "next/link";
import {
  RocketLaunchIcon,
  UsersIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";

export default function HomePage() {
  return (
    <main>
      <div>
        <div className="relative p-4">
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gray-100" />
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="relative shadow-xl sm:overflow-hidden sm:rounded-2xl">
              <div className="absolute inset-0">
                <div
                  className="h-full w-full bg-gradient-to-br from-indigo-900 via-indigo-600 to-indigo-400"
                  aria-hidden="true"
                />
                <div className="absolute inset-0 bg-black opacity-30 mix-blend-multiply" />
              </div>
              <div className="relative px-6 py-16 sm:py-24 lg:px-8 lg:py-32">
                <h1 className="text-center text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  <span className="block text-white">Take control of your</span>
                  <span className="block text-indigo-200">Tao</span>
                </h1>
                <p className="mx-auto mt-6 max-w-lg text-center text-xl text-indigo-200 sm:max-w-3xl">
                  Delegate to earn rewards while supporting your chosen subnets.
                  You decide which subnets to incentivize! Giving power back to
                  the delegators.
                </p>
                <div className="mx-auto mt-10 max-w-sm sm:flex sm:max-w-none sm:justify-center">
                  <div className="space-y-4 sm:mx-auto sm:inline-grid sm:grid-cols-3 sm:gap-5 sm:space-y-0">
                    <Link
                      href="/staking"
                      className="flex items-center justify-center gap-2 rounded-md border border-transparent bg-indigo-500 bg-opacity-60 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-opacity-70 sm:px-8"
                    >
                      Stake Tao <RocketLaunchIcon className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/delegators"
                      className="flex items-center justify-center gap-2 rounded-md border border-transparent bg-white px-4 py-3 text-base font-medium text-indigo-700 shadow-sm hover:bg-indigo-50 sm:px-8"
                    >
                      Delegate Now <UsersIcon className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/weights"
                      className="flex items-center justify-center gap-2 rounded-md border border-transparent bg-indigo-500 bg-opacity-60 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-opacity-70 sm:px-8"
                    >
                      Manage Your Weights <ScaleIcon className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logo cloud */}
        <div className="bg-gray-200">
          <div className="mx-auto max-w-7xl px-6 pb-4 pt-16 lg:px-8">
            <p className="text-center text-base font-semibold text-gray-500">
              Trusted by Top Validators
            </p>
            <div className="mt-6">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
                <div className="group flex flex-col items-center justify-center p-2">
                  <div className="flex items-center justify-center">
                    <Link href="https://foundrydigital.com/" target="_blank">
                      <Image
                        alt="Foundry"
                        src="/foundrylogo.jpg"
                        width={100}
                        height={60}
                        className="rounded-full object-contain transition-transform duration-300 group-hover:scale-110"
                      />
                    </Link>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 transition-all duration-300 group-hover:scale-150 group-hover:font-bold">
                    Foundry
                  </p>
                </div>
                <div className="group flex h-full flex-col items-center justify-center">
                  <div className="flex flex-grow items-center justify-center">
                    <Link href="https://opentensor.ai/" target="_blank">
                      <Image
                        alt="OTF"
                        src="/otf-logo.svg"
                        width={100}
                        height={60}
                        className="object-contain transition-transform duration-300 group-hover:scale-110"
                      />
                    </Link>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 transition-all duration-300 group-hover:scale-150 group-hover:font-bold">
                    OTF
                  </p>
                </div>
                <div className="group flex h-full flex-col items-center justify-center">
                  <div className="flex flex-grow items-center justify-center">
                    <Link href="https://www.roundtable21.com/" target="_blank">
                      <Image
                        alt="RoundTable21"
                        src="/roundtable21logo.jpg"
                        width={100}
                        height={60}
                        className="rounded-full object-contain transition-transform duration-300 group-hover:scale-110"
                      />
                    </Link>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 transition-all duration-300 group-hover:scale-150 group-hover:font-bold">
                    RoundTable21
                  </p>
                </div>
                <div className="group flex h-full flex-col items-center justify-center">
                  <div className="flex flex-grow items-center justify-center">
                    <Link href="https://www.manifold.inc/" target="_blank">
                      <Image
                        alt="Manifold Labs"
                        src="/ManifoldLogoPink.png"
                        width={100}
                        height={60}
                        className="rounded-full object-contain transition-transform duration-300 group-hover:scale-110"
                      />
                    </Link>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 transition-all duration-300 group-hover:scale-150 group-hover:font-bold">
                    Manifold Labs
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
