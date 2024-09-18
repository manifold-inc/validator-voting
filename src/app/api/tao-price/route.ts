import { PriceServiceConnection } from "@pythnetwork/price-service-client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const connection = new PriceServiceConnection(
      "https://hermes.pyth.network",
    );

    const priceID = [
      "0x410f41de235f2db824e562ea7ab2d3d3d4ff048316c61d629c0b93f58584e1af",
    ];
    const currentPrices = await connection.getLatestPriceFeeds(priceID);
    return NextResponse.json({ currentPrices }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch price" },
      { status: 500 },
    );
  }
}
