import { PriceServiceConnection } from "@pythnetwork/price-service-client";

export const fetchPrice = async () => {
  try {
    const connection = new PriceServiceConnection(
      "https://hermes.pyth.network",
    );

    const priceID = [
      "0x410f41de235f2db824e562ea7ab2d3d3d4ff048316c61d629c0b93f58584e1af",
    ];
    const currentPrices = await connection.getLatestPriceFeeds(priceID);

    return (
      currentPrices?.[0]?.getPriceUnchecked().getPriceAsNumberUnchecked() ?? 0
    );
  } catch (err) {
    console.error("Error fetching tao price:", err);
  }
};
