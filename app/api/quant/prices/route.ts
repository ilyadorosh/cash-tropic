import { NextRequest, NextResponse } from "next/server";

// api.binance.com returns 451 (geo-blocked) for US-origin requests, and
// Vercel's default region (iad1, US East) is exactly that — this broke the
// feed for every real deployed user, not just in build logs. CoinGecko's
// public markets endpoint serves the same data without the block, but its
// free anonymous tier is rate-limited (429) and Vercel egress IPs are
// shared across many customers, so that limit gets hit fast. This route is
// pure live data — it must never be statically prerendered at build time.
export const dynamic = "force-dynamic";

const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  SOL: "solana",
  XRP: "ripple",
  DOGE: "dogecoin",
  ADA: "cardano",
  AVAX: "avalanche-2",
  LINK: "chainlink",
  DOT: "polkadot",
  UNI: "uniswap",
  AAVE: "aave",
  MKR: "maker",
};
const COINGECKO_ID_TO_SYMBOL = Object.fromEntries(
  Object.entries(SYMBOL_TO_COINGECKO_ID).map(([symbol, id]) => [id, symbol]),
);

type PriceEntry = {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  high24h: number;
  low24h: number;
};

// Last good response, kept in memory for the life of this serverless
// instance — a 429/network blip serves slightly-stale data instead of
// zeroing out the whole UI.
let lastGood: { prices: PriceEntry[]; timestamp: number } | null = null;

export async function GET(req: NextRequest) {
  try {
    const ids = Object.values(SYMBOL_TO_COINGECKO_ID).join(",");
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&price_change_percentage=24h`,
      { next: { revalidate: 30 } }, // CoinGecko's free tier is rate-limited; 5s was far too aggressive
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API: ${response.status}`);
    }

    const data = await response.json();

    const prices: PriceEntry[] = data.map((coin: any) => ({
      symbol: COINGECKO_ID_TO_SYMBOL[coin.id] || coin.symbol.toUpperCase(),
      price: coin.current_price,
      change24h: coin.price_change_percentage_24h ?? 0,
      volume: coin.total_volume,
      high24h: coin.high_24h,
      low24h: coin.low_24h,
    }));

    lastGood = { prices, timestamp: Date.now() };

    return NextResponse.json({
      success: true,
      prices,
      timestamp: lastGood.timestamp,
    });
  } catch (error) {
    console.error("[Crypto Prices]", error);

    if (lastGood) {
      return NextResponse.json({
        success: true,
        prices: lastGood.prices,
        timestamp: lastGood.timestamp,
        stale: true,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch prices",
      },
      { status: 500 },
    );
  }
}
