// API route for money gather system
import { NextRequest, NextResponse } from "next/server";
import { MoneyGather, MoneySource } from "@/app/game/MoneyGather";
import { LuxuryPlanCompute } from "@/app/game/LuxuryPlanCompute";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  const action = searchParams.get("action");

  if (!userId) {
    return NextResponse.json(
      { error: "userId is required" },
      { status: 400 },
    );
  }

  try {
    // In production, load from database
    // For now, create a demo instance
    const planCompute = new LuxuryPlanCompute();
    const moneyGather = new MoneyGather(500, planCompute);

    switch (action) {
      case "stats":
        return NextResponse.json({
          success: true,
          stats: moneyGather.getStats(),
        });

      case "sources":
        return NextResponse.json({
          success: true,
          sources: moneyGather.getActiveSources(),
        });

      case "history":
        const count = parseInt(searchParams.get("count") || "10");
        return NextResponse.json({
          success: true,
          history: moneyGather.getHistory(count),
        });

      default:
        return NextResponse.json(
          { error: "Invalid action. Use ?action=stats, sources, or history" },
          { status: 400 },
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch money data" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userId, sourceId, amount, sources } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    // In production, load from database
    const planCompute = new LuxuryPlanCompute();
    const moneyGather = new MoneyGather(500, planCompute);

    switch (action) {
      case "collect": {
        if (sourceId) {
          // Collect from specific source
          const result = moneyGather.collectFromSource(sourceId);
          if (!result) {
            return NextResponse.json(
              { error: "Cannot collect from this source yet" },
              { status: 400 },
            );
          }
          return NextResponse.json({
            success: true,
            result,
            balance: moneyGather.getBalance(),
          });
        } else {
          // Collect from all sources
          const results = moneyGather.collectAll();
          return NextResponse.json({
            success: true,
            results,
            balance: moneyGather.getBalance(),
            message: `Collected from ${results.length} sources`,
          });
        }
      }

      case "auto-collect": {
        // Auto-collect passive income
        const results = moneyGather.autoCollect();
        return NextResponse.json({
          success: true,
          results,
          balance: moneyGather.getBalance(),
          message: `Auto-collected from ${results.length} passive sources`,
        });
      }

      case "add-source": {
        if (!sources || !Array.isArray(sources)) {
          return NextResponse.json(
            { error: "sources array is required" },
            { status: 400 },
          );
        }

        sources.forEach((source: MoneySource) => {
          moneyGather.addSource(source);
        });

        return NextResponse.json({
          success: true,
          message: `Added ${sources.length} money sources`,
          stats: moneyGather.getStats(),
        });
      }

      case "add-money": {
        if (typeof amount !== "number") {
          return NextResponse.json(
            { error: "amount is required" },
            { status: 400 },
          );
        }

        moneyGather.addMoney(amount, "api");
        return NextResponse.json({
          success: true,
          balance: moneyGather.getBalance(),
          message: `Added ${amount} money`,
        });
      }

      case "spend": {
        if (typeof amount !== "number") {
          return NextResponse.json(
            { error: "amount is required" },
            { status: 400 },
          );
        }

        const success = moneyGather.spendMoney(amount);
        if (!success) {
          return NextResponse.json(
            { error: "Insufficient funds" },
            { status: 400 },
          );
        }

        return NextResponse.json({
          success: true,
          balance: moneyGather.getBalance(),
          message: `Spent ${amount} money`,
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 },
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process money request" },
      { status: 500 },
    );
  }
}
