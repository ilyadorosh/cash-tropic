import { NextRequest, NextResponse } from "next/server";
import {
  getAllProfiles,
  createProfile,
  updateProfile,
  deleteProfile,
  getProfileByUsername,
} from "@/app/lib/drizzle";

// GET all profiles
export async function GET(req: NextRequest) {
  try {
    const profiles = await getAllProfiles();
    return NextResponse.json({ success: true, profiles });
  } catch (error) {
    console.error("Error fetching profiles:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch profiles",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// POST - Create or update a profile
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, context } = body;

    // Validate input
    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 },
      );
    }

    // Check if profile exists
    const existingProfile = await getProfileByUsername({ username });

    if (existingProfile) {
      // Update existing profile
      await updateProfile({ username, context: context || "" });
      return NextResponse.json({
        success: true,
        message: "Profile updated successfully",
        action: "updated",
      });
    } else {
      // Create new profile
      await createProfile({ username, context: context || "" });
      return NextResponse.json({
        success: true,
        message: "Profile created successfully",
        action: "created",
      });
    }
  } catch (error) {
    console.error("Error saving profile:", error);
    return NextResponse.json(
      {
        error: "Failed to save profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// DELETE a profile
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 },
      );
    }

    // Check if profile exists
    const existingProfile = await getProfileByUsername({ username });

    if (!existingProfile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 },
      );
    }

    await deleteProfile({ username });
    return NextResponse.json({
      success: true,
      message: "Profile deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting profile:", error);
    return NextResponse.json(
      {
        error: "Failed to delete profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const runtime = "nodejs";
