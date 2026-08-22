# backend/league_versions.py
# Single source of truth for which "version" of the Premier/Championship
# mini-league a given season used (e.g. Premier League v3 for 2023-24).
# The league gets recreated some off-seasons (membership/settings change
# enough to warrant a fresh FPL league ID), so "version" isn't the same
# thing as "season" -- there's no fixed formula, it's just whichever
# version was actually live that year.
#
# Update this when a season rolls over and a league gets a new version
# (see backend/scripts/season_rollover.py) -- same data main.py's
# _LEAGUE_VERSIONS / _STATIC_SEASON_META track for the season archive
# pages, kept here too so managers_db_version.py (which main.py itself
# imports, so it can't import back from main.py) can use it for the
# manager profile's Season Stats table.

from typing import Optional

LEAGUE_VERSIONS: dict = {
    "premier": {
        "2021-22": "v1",
        "2022-23": "v2",
        "2023-24": "v3",
        "2024-25": "v4",
        "2025-26": "v5",
    },
    "championship": {
        "2023-24": "v1",
        "2024-25": "v2",
        "2025-26": "v3",
    },
}

LEAGUE_DISPLAY_NAME = {
    "premier": "Premier League",
    "championship": "Championship League",
}


def league_full_label(league_key: Optional[str], season: Optional[str]) -> Optional[str]:
    """'premier', '2023-24' -> 'Premier League v3'. None if unknown."""
    if not league_key or not season:
        return None
    name = LEAGUE_DISPLAY_NAME.get(league_key.strip().lower())
    version = LEAGUE_VERSIONS.get(league_key.strip().lower(), {}).get(season)
    if not name or not version:
        return None
    return f"{name} {version}"
