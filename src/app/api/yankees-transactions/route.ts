import { NextRequest, NextResponse } from "next/server";

type MLBTransaction = {
  id: number;
  date: string;
  typeDesc?: string;
  description?: string;
  person?: {
    id: number;
    fullName: string;
  };
};

type MLBTransactionsResponse = {
  transactions?: MLBTransaction[];
};

export async function GET(request: NextRequest) {
  const season = Number(
    request.nextUrl.searchParams.get("season") ?? 2026
  );

  if (!Number.isInteger(season) || season < 2000 || season > 2100) {
    return NextResponse.json(
      { error: "Invalid season." },
      { status: 400 }
    );
  }

  const startDate = `01/01/${season}`;
  const endDate = `12/31/${season}`;

  const url = new URL(
    "https://statsapi.mlb.com/api/v1/transactions"
  );

  url.searchParams.set("teamId", "147");
  url.searchParams.set("startDate", startDate);
  url.searchParams.set("endDate", endDate);

  try {
    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`MLB API returned ${response.status}`);
    }

    const data =
      (await response.json()) as MLBTransactionsResponse;

    const unique = new Map<number, MLBTransaction>();

    for (const transaction of data.transactions ?? []) {
      const existing = unique.get(transaction.id);

      if (
        !existing ||
        (!existing.person && transaction.person)
      ) {
        unique.set(transaction.id, transaction);
      }
    }

    const transactions = [...unique.values()].sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.id - a.id
    );

    return NextResponse.json({
      season,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error("Yankees transactions error:", error);

    return NextResponse.json(
      { error: "Unable to load Yankees transactions." },
      { status: 502 }
    );
  }
}
