import json
import urllib.parse
import urllib.request

BASE = "https://statsapi.mlb.com/api/v1/stats/leaders"

CATEGORIES = {
    "hitting": ["homeRuns", "hits", "rbi", "stolenBases"],
    "pitching": ["wins", "strikeouts", "saves"],
}

SEASONS = [1927, 1961, 1978, 1998, 2022, 2026]

def fetch_leaders(group, category, season):
    params = {
        "leaderCategories": category,
        "statGroup": group,
        "statType": "season",
        "teamId": 147,
        "season": season,
        "limit": 10,
    }

    url = BASE + "?" + urllib.parse.urlencode(params)

    request = urllib.request.Request(
        url,
        headers={"User-Agent": "TheBronxIndex/1.0"},
    )

    with urllib.request.urlopen(request, timeout=30) as response:
        data = json.load(response)

    records = []

    for block in data.get("leagueLeaders", []):
        expected_category = (
            "runsBattedIn" if category == "rbi" else category
        )

        if block.get("leaderCategory") != expected_category:
            continue

        for leader in block.get("leaders", []):
            records.append({
                "playerId": leader.get("person", {}).get("id"),
                "player": leader.get("person", {}).get("fullName"),
                "season": int(leader.get("season", season)),
                "value": leader.get("value"),
                "rank": leader.get("rank"),
            })

    return records

results = {}

for group, categories in CATEGORIES.items():
    for category in categories:
        key = f"{group}.{category}"
        results[key] = []

        for season in SEASONS:
            try:
                records = fetch_leaders(group, category, season)
                results[key].extend(records)

                print(
                    f"{season} | {key}: {len(records)} records"
                )

            except Exception as error:
                print(f"ERROR | {season} | {key}: {error}")

print("\n" + "=" * 55)
print("SAMPLE COLLECTION COMPLETE")
print("=" * 55)

for key, records in results.items():
    ranked = sorted(
        records,
        key=lambda record: float(record["value"]),
        reverse=True,
    )

    print(f"\n{key}:")
    for record in ranked[:3]:
        print(
            f"  {record['player']} ({record['season']}) "
            f"— {record['value']}"
        )
