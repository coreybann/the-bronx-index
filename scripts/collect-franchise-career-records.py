#!/usr/bin/env python3

import json
import time
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

OUTPUT = Path("src/data/yankees-franchise-career-records.json")
BASE_URL = "https://statsapi.mlb.com/api/v1/stats/leaders"

CATEGORIES = {
    "hitting": ["homeRuns", "hits", "rbi", "stolenBases"],
    "pitching": ["wins", "strikeouts", "saves"],
}

def fetch_leaders(group, category):
    params = urlencode({
        "leaderCategories": category,
        "statGroup": group,
        "statType": "career",
        "teamId": 147,
        "limit": 100,
    })

    request = Request(
        f"{BASE_URL}?{params}",
        headers={"User-Agent": "TheBronxIndex/1.0"},
    )

    for attempt in range(3):
        try:
            with urlopen(request, timeout=30) as response:
                data = json.load(response)

            expected = "runsBattedIn" if category == "rbi" else category

            matching = next(
                (
                    item for item in data.get("leagueLeaders", [])
                    if item.get("leaderCategory") == expected
                ),
                None,
            )

            if matching is None:
                raise ValueError(f"Missing category: {group}.{category}")

            leaders = matching.get("leaders", [])

            if not leaders:
                raise ValueError(f"No leaders: {group}.{category}")

            results = []

            for leader in leaders:
                person = leader.get("person", {})
                player_id = person.get("id")
                name = person.get("fullName")
                value = leader.get("value")

                if player_id is None or not name or value is None:
                    continue

                results.append({
                    "playerId": player_id,
                    "player": name,
                    "value": value,
                })

            if not results:
                raise ValueError(f"No valid records: {group}.{category}")

            return results

        except Exception:
            if attempt == 2:
                raise
            time.sleep(2 * (attempt + 1))

def main():
    categories = {}

    for group, stats in CATEGORIES.items():
        for category in stats:
            key = f"{group}.{category}"
            leaders = fetch_leaders(group, category)
            categories[key] = leaders
            print(f"{key}: {len(leaders)} career leaders", flush=True)

    assert len(categories) == 7

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    OUTPUT.write_text(
        json.dumps(
            {
                "teamId": 147,
                "recordType": "career",
                "categories": categories,
            },
            indent=2,
        ) + "\n"
    )

    print(f"\nCareer records saved: {OUTPUT}")

if __name__ == "__main__":
    main()
