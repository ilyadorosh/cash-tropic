import { NextRequest, NextResponse } from "next/server";

// Binance public API - no auth needed
const SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT",
  "DOGEUSDT", "ADAUSDT", "AVAXUSDT", "LINKUSDT", "DOTUSDT",
  "UNIUSDT", "AAVEUSDT", "MKRUSDT"
];

export async function GET(req: NextRequest) {
  try {
    // Fetch 24h ticker for all symbols at once
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbols=${JSON.stringify(SYMBOLS)}`,
      { next: { revalidate: 5 } } // Cache for 5 seconds
    );

    if (!response.ok) {
      throw new Error(`Binance API: ${response.status}`);
    }

    const data = await response.json();

    const prices = data.map((ticker: any) => ({
      symbol: ticker.symbol.replace("USDT", ""),
      price: parseFloat(ticker.lastPrice),
      change24h: parseFloat(ticker.priceChangePercent),
      volume: parseFloat(ticker.quoteVolume), // Volume in USDT
      high24h: parseFloat(ticker.highPrice),
      low24h: parseFloat(ticker.lowPrice),
    }));

    return NextResponse.json({ 
      success: true, 
      prices,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error("[Binance Prices]", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch prices" 
    }, { status: 500 });
  }
}
