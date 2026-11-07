import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def load(filename):
    return json.loads((ROOT / "src/data" / filename).read_text())

legends = load("yankees-legends.json")
championships = load("yankees-championships.json")
player_titles = load("yankees-legend-championships.json")
managerial = load("yankees-legend-managerial.json")

valid_years = {entry["year"] for entry in championships}
errors = []

def check(condition, message):
    if not condition:
        errors.append(message)
        print("FAIL:", message)

def fetch_json(url):
    request = urllib.request.Request(
        url, headers={"User-Agent": "TheBronxIndex/1.0"}
    )
    with urllib.request.urlopen(request, timeout=25) as response:
        return json.load(response)

print("Validating Yankees Legends...\n")

check(len(legends) == 24, "Expected 24 honorees")
check(len({p["id"] for p in legends}) == 24, "Duplicate MLB IDs")
check(
    len({p["retiredNumber"] for p in legends}) == 23,
    "Expected 23 distinct retired numbers",
)

for legend in legends:
    name = legend["name"]
    player_id = legend["id"]
    profile_type = legend["profileType"]

    print(f"Checking {name}...")

    check(
        profile_type in ("hitting", "pitching", "managerial"),
        f"{name}: invalid profile type",
    )

    check(
        legend["startYear"] <= legend["endYear"],
        f"{name}: invalid career dates",
    )

    try:
        person = fetch_json(
            f"https://statsapi.mlb.com/api/v1/people/{player_id}"
        ).get("people", [None])[0]

        check(person is not None, f"{name}: missing MLB person record")

        if person:
            check(
                person.get("fullName", "").lower() == name.lower(),
                f"{name}: MLB name mismatch",
            )

        if profile_type != "managerial":
            data = fetch_json(
                f"https://statsapi.mlb.com/api/v1/people/{player_id}/stats"
                f"?stats=yearByYear&group={profile_type}"
                f"&leagueListId=mlb_hist"
            )

            seasons = sorted({
                int(split["season"])
                for block in data.get("stats", [])
                for split in block.get("splits", [])
                if split.get("team", {}).get("id") == 147
                and str(split.get("season", "")).isdigit()
            })

            check(bool(seasons), f"{name}: no Yankees stats")

            if seasons:
                check(
                    seasons[0] == legend["startYear"],
                    f"{name}: starting season mismatch",
                )
                check(
                    seasons[-1] == legend["endYear"],
                    f"{name}: ending season mismatch",
                )

    except Exception as error:
        check(False, f"{name}: API error — {error}")

    years = player_titles.get(str(player_id), [])

    check(
        all(year in valid_years for year in years),
        f"{name}: invalid championship year",
    )

    if profile_type == "managerial" or legend["role"] == "Player/Manager":
        check(
            str(player_id) in managerial,
            f"{name}: missing managerial history",
        )

for player_id, record in managerial.items():
    check(
        all(year in valid_years for year in record["worldSeriesTitles"]),
        f"{record['name']}: invalid managerial championship year",
    )

print("\n" + "=" * 45)

if errors:
    print(f"VALIDATION FAILED: {len(errors)} issue(s)")
    sys.exit(1)

print("ALL 24 YANKEES LEGENDS VALIDATED")
