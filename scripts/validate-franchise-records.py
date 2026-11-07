import json
import math
from pathlib import Path

DATA_DIR = Path("src/data")

FILES = {
    "season": DATA_DIR / "yankees-franchise-season-records.json",
    "career": DATA_DIR / "yankees-franchise-career-records.json",
}

CATEGORIES = {
    "hitting.homeRuns",
    "hitting.hits",
    "hitting.rbi",
    "hitting.stolenBases",
    "pitching.wins",
    "pitching.strikeouts",
    "pitching.saves",
}

errors = []
total = 0

for record_type, path in FILES.items():
    data = json.loads(path.read_text())
    categories = data["categories"]

    missing = CATEGORIES - set(categories)
    extra = set(categories) - CATEGORIES

    if missing:
        errors.append(f"{record_type}: Missing {sorted(missing)}")

    if extra:
        errors.append(f"{record_type}: Unexpected {sorted(extra)}")

    print(f"\n=== {record_type.upper()} RECORDS ===")

    for category, records in categories.items():
        seen = set()

        for index, record in enumerate(records):
            total += 1

            player_id = record.get("playerId")
            player = record.get("player")
            season = record.get("season")
            value = record.get("value")

            if not isinstance(player_id, int) or player_id <= 0:
                errors.append(f"{category}[{index}]: Invalid player ID")

            if not isinstance(player, str) or not player.strip():
                errors.append(f"{category}[{index}]: Missing player name")

            if record_type == "season":
                if not isinstance(season, int) or not 1903 <= season <= 2026:
                    errors.append(f"{category}[{index}]: Invalid season")

                key = (player_id, season)
            else:
                key = player_id

            if key in seen:
                errors.append(f"{category}: Duplicate {key}")

            seen.add(key)

            try:
                number = float(value)
                if not math.isfinite(number) or number < 0:
                    raise ValueError()
            except (TypeError, ValueError):
                errors.append(f"{category}[{index}]: Invalid value")

        print(f"{category}: {len(records)} records")

print("\n" + "=" * 50)
print(f"TOTAL RECORDS CHECKED: {total}")
print(f"VALIDATION ERRORS: {len(errors)}")

if errors:
    for error in errors[:30]:
        print("ERROR:", error)

    raise SystemExit(1)

print("ALL DATASET STRUCTURE CHECKS PASSED")
