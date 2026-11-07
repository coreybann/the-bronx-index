import { NextRequest, NextResponse } from "next/server";
import {
  FRANCHISE_RECORD_CATEGORIES,
  getYankeesSingleSeasonLeaders,
  getYankeesCareerLeaders,
  type FranchiseStatGroup,
  type FranchiseRecordCategory,
} from "@/lib/yankeesFranchiseRecords";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const group = searchParams.get("group") ?? "hitting";
  const category = searchParams.get("category") ?? "homeRuns";
  const type = searchParams.get("type") ?? "season";
  const limitParam = searchParams.get("limit") ?? "25";
  const validLimits = ["25", "50", "100"];

  if (!validLimits.includes(limitParam)) {
    return NextResponse.json(
      { error: "Invalid leaderboard limit" },
      { status: 400 }
    );
  }

  const limit = Number(limitParam);

  if (group !== "hitting" && group !== "pitching") {
    return NextResponse.json(
      { error: "Invalid statistical group" },
      { status: 400 }
    );
  }

  const validCategories: readonly string[] =
    FRANCHISE_RECORD_CATEGORIES[group].map(
      (item) => item.id
    );

  if (!validCategories.includes(category)) {
    return NextResponse.json(
      { error: "Invalid statistical category" },
      { status: 400 }
    );
  }

  if (type !== "season" && type !== "career") {
    return NextResponse.json(
      { error: "Unsupported record type" },
      { status: 400 }
    );
  }

  const records =
    type === "career"
      ? getYankeesCareerLeaders(
          group as FranchiseStatGroup,
          category as FranchiseRecordCategory,
          limit
        )
      : getYankeesSingleSeasonLeaders(
          group as FranchiseStatGroup,
          category as FranchiseRecordCategory,
          limit
        );

  return NextResponse.json({
    type,
    group,
    category,
    records,
    limit,
    source: "MLB Stats API",
    startYear: 1903,
    endYear: 2026,
  });
}
