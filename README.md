# Home Assistant configuration

Configuration for this household’s Home Assistant dashboards, lighting, music,
and chicken coop. This is a personal setup with specific device IDs and local
assets, rather than a ready-to-install dashboard package.

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

| Destination | Speakers | Starting volume |
|---|---|---|
| Main Floor | Living Room, Office, Dining Room, Three Season Porch | 20% each |
| Everywhere | Main Floor, Bedroom, Basement, Record Player | 20% each |
| Bedroom, Basement, Record Player | Only the selected speaker | Previous volume |

Changing destinations moves the current queue and replaces the speaker group.
Roam is excluded. The Record Player speaker is in the porch and is separate from
the regular porch speaker. Group playback controls adjust the active group.
Tapping the player’s artwork or name on Home or Porch opens Music.

Rows refresh every ten minutes; **Refresh music** requests an update immediately.
If recommendations are unavailable, check the Queue Actions setup below.

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

## Setting up or restoring

Restore the full Home Assistant Docker volume for an existing installation.
Git alone does not contain integration credentials, device registrations,
downloaded integrations/cards, or most dashboard assets.

For a new installation, use `.HA_VERSION` as the tested Home Assistant version,
then configure the integrations and update entity IDs, area IDs, Music Assistant
player IDs, and config-entry IDs to match your installation. In particular,
`templates/music.yaml` references this household’s Queue Actions config entry.

Dependencies:

- **Music Assistant:** runs separately at `http://nas.local:8095/`, with Apple Music
  and Sonos speakers configured there. Add the official Music Assistant integration
  in HA; the native HA Sonos integration is not needed.
- **[Music Assistant Queue Actions](https://github.com/droans/mass_queue):** install
  the custom integration, then add it in **Settings → Devices & services** using
  the Music Assistant address. Copying its files alone does not configure it.
  It supplies recommendations; search, playlists, and albums use the official integration.
- **Other custom integrations:** [Omlet Smart Coop](https://github.com/krozgrov/ha-omlet-integration),
  [Meross LAN](https://github.com/krahabb/meross_lan), and
  [Arlo Camera Support](https://github.com/twrecked/hass-aarlo).
- **Frontend cards:** Card Mod, Layout Card, Clock Weather Card, Button Card,
  Mini Media Player, State Switch, and Config Template Card. Resource URLs are
  declared under `lovelace.resources` in `configuration.yaml`.
- **Local assets:** restore the room photos and styles under `www/`. The custom
  keyboard module, `www/dashboard/music-hotkeys.js`, is tracked in Git.

Keep credentials in HA’s integration settings or the untracked `secrets.yaml`.
Back up the entire Docker volume to retain data that is not in Git.

## Development and maintenance

For configuration files, applying edits, resource reloads, and CI checks, see the
[development guide](docs/development.md). These steps are for maintaining the
setup; they are not required for everyday dashboard use.
