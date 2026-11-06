export const YANKEES_AFFILIATES = [
  { id: 531, name: "Scranton/Wilkes-Barre RailRiders", level: "Triple-A" },
  { id: 1956, name: "Somerset Patriots", level: "Double-A" },
  { id: 537, name: "Hudson Valley Renegades", level: "High-A" },
  { id: 587, name: "Tampa Tarpons", level: "Single-A" },
  { id: 475, name: "FCL Yankees", level: "Rookie" },
  { id: 635, name: "DSL NYY Yankees", level: "Rookie" },
  { id: 634, name: "DSL NYY Bombers", level: "Rookie" },
] as const;

export type YankeesProspect = {
  id: number;
  name: string;
  age: number | null;
  position: string;
  bats: string;
  throws: string;
  height: string;
  weight: number | null;
  affiliates: {
    id: number;
    name: string;
    level: string;
  }[];
};

type MLBPerson = {
  id: number;
  fullName: string;
  currentAge?: number;
  primaryPosition?: { abbreviation?: string };
  batSide?: { code?: string };
  pitchHand?: { code?: string };
  height?: string;
  weight?: number;
};

type MLBRosterEntry = {
  person: MLBPerson;
};

export async function getYankeesProspects(
  season = 2026
): Promise<YankeesProspect[]> {
  const results = await Promise.all(
    YANKEES_AFFILIATES.map(async (affiliate) => {
      const url =
        `https://statsapi.mlb.com/api/v1/teams/${affiliate.id}/roster` +
        `?rosterType=fullSeason&season=${season}&hydrate=person`;

      const response = await fetch(url, {
        next: { revalidate: 86400 },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to load ${affiliate.name}: ${response.status}`
        );
      }

      const data: { roster?: MLBRosterEntry[] } = await response.json();

      return {
        affiliate,
        roster: data.roster ?? [],
      };
    })
  );

  const players = new Map<number, YankeesProspect>();

  for (const { affiliate, roster } of results) {
    for (const entry of roster) {
      const person = entry.person;

      if (!person?.id) continue;

      const existing = players.get(person.id);

      if (existing) {
        existing.affiliates.push({
          id: affiliate.id,
          name: affiliate.name,
          level: affiliate.level,
        });
        continue;
      }

      players.set(person.id, {
        id: person.id,
        name: person.fullName,
        age: person.currentAge ?? null,
        position: person.primaryPosition?.abbreviation ?? "—",
        bats: person.batSide?.code ?? "—",
        throws: person.pitchHand?.code ?? "—",
        height: person.height ?? "—",
        weight: person.weight ?? null,
        affiliates: [
          {
            id: affiliate.id,
            name: affiliate.name,
            level: affiliate.level,
          },
        ],
      });
    }
  }

  return Array.from(players.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}
