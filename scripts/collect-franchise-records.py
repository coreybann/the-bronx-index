import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / ".cache" / "franchise-records"
OUTPUT = ROOT / "src/data/yankees-franchise-season-records.json"

BASE = "https://statsapi.mlb.com/api/v1/stats/leaders"

START_YEAR = 1903
END_YEAR = 2026

CATEGORIES = {
    "hitting": ["homeRuns", "hits", "rbi", "stolenBases"],
    "pitching": ["wins", "strikeouts", "saves"],
}

CATEGORY_NAMES = {
    "rbi": "runsBattedIn",
}

def fetch(group, category, season):
    params = {
        "leaderCategories": category,
        "statGroup": group,
        "statType": "season",
        "teamId": 147,
        "season": season,
        "limit": 10,
    }

    url = BASE + "?" + urllib.parse.urlencode(params)

    for attempt in range(3):
        try:
            request = urllib.request.Request(
                url,
                headers={"User-Agent": "TheBronxIndex/1.0"},
            )

            with urllib.request.urlopen(request, timeout=30) as response:
                data = json.load(response)

            expected = CATEGORY_NAMES.get(category, category)
            matching = [
                block
                for block in data.get("leagueLeaders", [])
                if block.get("leaderCategory") == expected
            ]

            if len(matching) != 1:
                raise ValueError(
                    f"Expected one {expected} category, got {len(matching)}"
                )

            records = []

            for leader in matching[0].get("leaders", []):
                person = leader.get("person", {})
                value = leader.get("value")

                if person.get("id") is None or value is None:
                    raise ValueError("Incomplete leaderboard entry")

                records.append({
                    "playerId": person["id"],
                    "player": person["fullName"],
                    "season": int(leader.get("season", season)),
                    "value": value,
                })

            if not records:
                raise ValueError("Empty leaderboard")

            return records

        except Exception as error:
            if attempt == 2:
                raise RuntimeError(
                    f"{season} {group}.{category}: {error}"
                ) from error

            time.sleep(2 * (attempt + 1))

def collect():
    CACHE.mkdir(parents=True, exist_ok=True)

    results = {
        f"{group}.{category}": []
        for group, categories in CATEGORIES.items()
        for category in categories
    }

    failures = []

    for season in range(START_YEAR, END_YEAR + 1):
        for group, categories in CATEGORIES.items():
            for category in categories:
                key = f"{group}.{category}"
                cache_file = CACHE / f"{season}-{group}-{category}.json"

                try:
                    if cache_file.exists():
                        records = json.loads(cache_file.read_text())
                    else:
                        records = fetch(group, category, season)
                        cache_file.write_text(
                            json.dumps(records, indent=2) + "\n"
                        )
                        time.sleep(0.15)

                    if not records:
                        raise ValueError("Empty cached records")

                    results[key].extend(records)

                except Exception as error:
                    failures.append(str(error))
                    print("ERROR:", error)

        print(f"Processed {season}")

    if failures:
        print(f"\nCollection incomplete: {len(failures)} failures.")
        print("Existing output was not modified.")
        raise SystemExit(1)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    OUTPUT.write_text(json.dumps({
        "startYear": START_YEAR,
        "endYear": END_YEAR,
        "categories": results,
    }, indent=2) + "\n")

    print("\nHistorical franchise records saved:", OUTPUT)

if __name__ == "__main__":
    collect()
