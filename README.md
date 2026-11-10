# Home Assistant configuration

Home Assistant dashboards and automations for room controls, music, and chicken
coop monitoring. To use this configuration on a new installation, connect the
required integrations and map the configured devices to your own.

## Using the dashboard

Open **Main Panel** in Home Assistant. All screens share these four tabs:

| Tab | What’s there | Startup path |
|---|---|---|
| Home | Room controls, weather, and music playback | `/lovelace-main-panel/home` |
| Porch | Porch lights, fan, heater, weather, and music | `/lovelace-main-panel/porch` |
| Music | Speaker selection, search, recommendations, playlists, and albums | `/lovelace-main-panel/music` |
| Chickens | Doors, feeders, run light, water heaters, and device status | `/lovelace-main-panel/chicken-coop` |

Use a startup path to choose which tab a tablet opens. Home automatically uses
compact controls on screens narrower than 768px. On mobile tiles, tap the icon to
toggle a device or the text for more controls, such as fan speed.

A **Chicken alerts** badge appears on Home when attention is needed. Tap it to
open Chickens; the badge is hidden when there are no alerts.

### Playing music

1. Open Music and choose where to listen.
2. Tap a cover in **For you**, **Playlists**, or **Albums** to start that collection.
   Albums are ordered with recently played items first.
3. To find something specific, enter a search and press Enter or tap Search.
   Tapping a result starts a similar-music station; it does not save a station to
   Apple Music. Clear hides the results.

Destinations can be individual speakers or groups. Changing destinations moves
the current queue and replaces the speaker group. Group playback controls adjust
the active group. Some group presets reset the starting volume; configure those
levels when setting up your speakers.

Tapping the player’s artwork or name on Home or Porch opens Music.

Rows refresh every ten minutes; **Refresh music** requests an update immediately.
If recommendations are unavailable, check [Queue Actions setup](docs/setup.md#music-assistant).

### Keyboard shortcuts

Shortcuts work while the dashboard has keyboard focus and ignore text entry.

| Where | Shortcut | Action |
|---|---|---|
| Any Main Panel tab | Alt+1 / Option+1 on Mac | Home |
| Any Main Panel tab | Alt+2 / Option+2 on Mac | Porch |
| Any Main Panel tab | Alt+3 / Option+3 on Mac | Music |
| Any Main Panel tab | Alt+4 / Option+4 on Mac | Chickens |
| Music | Space | Play/pause |
| Music | Left / Right arrow | Previous/next track |
| Music | Up / Down arrow | Active group volume up/down by 3 percentage points |

## Setup and restore

Follow the [setup guide](docs/setup.md) to connect Music Assistant, install the
required cards and integrations, and map your devices. It also explains what
needs to be restored from a backup rather than Git.

## Development and maintenance

For configuration files, applying edits, resource reloads, and CI checks, see the
[development guide](docs/development.md). These steps are for maintaining the
setup; they are not required for everyday dashboard use.

## TRMNL chicken display

For a read-only e-ink screen showing food levels and chicken alerts, see the
[TRMNL setup guide](docs/trmnl.md).
