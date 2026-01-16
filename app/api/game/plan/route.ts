// API route for luxury plan management
import { NextRequest, NextResponse } from "next/server";
import { LuxuryPlanCompute, PlanTier, PLAN_PRICING } from "@/app/game/LuxuryPlanCompute";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const action = searchParams.get("action");

  try {
    switch (action) {
      case "features":
        // Get all plan features for comparison
        return NextResponse.json({
          success: true,
          plans: LuxuryPlanCompute.getPlanComparison(),
        });

      case "pricing":
        // Get pricing information
        return NextResponse.json({
          success: true,
          pricing: PLAN_PRICING,
        });

      default:
        return NextResponse.json(
          { error: "Invalid action. Use ?action=features or ?action=pricing" },
          { status: 400 },
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch plan info" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userId, planTier, durationMonths } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    switch (action) {
      case "upgrade": {
        if (!planTier || !Object.values(PlanTier).includes(planTier)) {
          return NextResponse.json(
            { error: "Invalid plan tier" },
            { status: 400 },
          );
        }

        // Create plan compute instance (in real app, load from DB)
        const planCompute = new LuxuryPlanCompute();

        // Upgrade the plan
        const newPlan = planCompute.upgradePlan(
          planTier as PlanTier,
          durationMonths || 1,
        );

        // In production, save to database here
        // await savePlanToDatabase(userId, newPlan);

        return NextResponse.json({
          success: true,
          plan: newPlan,
          message: `Successfully upgraded to ${planTier} tier`,
        });
      }

      case "check": {
        // Check current plan status
        // In production, load from database
        const planCompute = new LuxuryPlanCompute();

        return NextResponse.json({
          success: true,
          plan: planCompute.getPlan(),
          isActive: planCompute.isActive(),
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use 'upgrade' or 'check'" },
          { status: 400 },
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process plan request" },
      { status: 500 },
    );
  }
}
