export type AwardCategory =
  | "Major Awards"
  | "All-Star Selections"
  | "Postseason Honors"
  | "Hall of Fame"
  | "Yankees Honors"
  | "Other Recognition";

export type LegendAward = {
  id?: string;
  name: string;
  date?: string;
  season?: string;
  team?: {
    id?: number;
    name?: string;
  };
  category?: AwardCategory;
};

type AwardsResponse = {
  awards?: LegendAward[];
};

function getAwardCategory(name: string): AwardCategory {
  if (name === "Hall Of Fame") return "Hall of Fame";

  if (name === "Uniform number retired") {
    return "Yankees Honors";
  }

  if (name === "AL All-Star") {
    return "All-Star Selections";
  }

  if (
    /World Series MVP|ALCS MVP|Babe Ruth Award/i.test(name)
  ) {
    return "Postseason Honors";
  }

  if (
    /MVP|Rookie of the Year|Gold Glove|Silver Slugger|Hank Aaron|Relief Man|Comeback Player|Cy Young|American League Award|Clemente Award/i.test(name)
  ) {
    return "Major Awards";
  }

  return "Other Recognition";
}

export async function getYankeesLegendAwards(
  playerId: number
): Promise<LegendAward[]> {
  try {
    const response = await fetch(
      "https://statsapi.mlb.com/api/v1/people/" + playerId + "/awards",
      { next: { revalidate: 86400 } }
    );

    if (!response.ok) return [];

    const data: AwardsResponse = await response.json();

    return (data.awards ?? [])
      .filter(
        (award) =>
          award.name !== "World Series Championship" &&
          (award.team?.id === 147 ||
            award.name === "Hall Of Fame")
      )
      .map((award) => ({
        ...award,
        category: getAwardCategory(award.name),
      }))
      .sort((a, b) =>
        (a.date ?? "").localeCompare(b.date ?? "")
      );
  } catch {
    return [];
  }
}
