# Home Assistant Config

Personal Home Assistant configuration.

## Dashboards

| Dashboard | Description |
|---|---|
| Main Panel | Shared household dashboard: Home, Porch, Music, and Chickens tabs |

Main Panel is the primary dashboard. Tablet startup paths can select the relevant tab:
`/lovelace-main-panel/home`, `/lovelace-main-panel/porch`,
`/lovelace-main-panel/music`, or `/lovelace-main-panel/chicken-coop`.
Home uses Sections; the Porch and Chickens layouts remain unchanged.
The conditional Chicken alerts badge on Home opens the Chickens tab.
On screens narrower than 768px, the same Home tab shows compact weather and music,
and room controls as native tiles. Use the top tabs for navigation. Tap an icon to toggle a
device; tap its text to open controls (including fan speed). The bedtime action
asks for confirmation. Tablet layouts remain visible at 768px and above.

View definitions live in `dashboards/shared/`; the entry-point dashboards include
them from one dashboard. Home Assistant checks the
entry-point YAML timestamp when caching a dashboard: after editing a shared view,
update the timestamp of each dashboard that includes it, or force a dashboard reload.

Dashboards are in YAML mode (`dashboards/`). Resources (HACS cards) are declared in `configuration.yaml` under `lovelace.resources`.

## HACS Cards Used

- `custom:layout-card` — responsive grid layouts
- `custom:clock-weather-card` — clock + weather forecast
- `custom:button-card` — state-based icon/color buttons
- `custom:mini-media-player`
- `custom:state-switch`
- `custom:config-template-card` — dynamic music controls and library rows

## Music tabs

The Music tab includes `dashboards/shared/music.yaml` with destination
buttons, compact Mini Media Player controls, and three horizontal artwork rows:
For you (Apple Music recommendations), Playlists, and Albums (recently played first).
Tapping a cover calls `script.music_play_collection`, which resolves the selected
destination at execution time, prepares its speaker group if necessary, and starts
the collection. It does not add the collection behind the existing queue.

The Search music field searches Apple Music and the Music Assistant library for
tracks, albums, artists, and playlists. Press Enter or use Search; results appear
above the recommendation rows and play on the selected destination. Clear hides
results. Tap a search-result cover to start a station (`radio_mode: true`) from
that result. Search results have a single action. This starts a similar-music mix and
does not save a station to Apple Music. The query is shared across dashboard views. The native input-text
helper and a fourth trigger-based template sensor provide the query/results;
search does not depend on Queue Actions. Stale results are hidden while a new
query is loading. A live search returned results through this path without
changing playback.

The Main Floor volume slider and Home players use Mini Media Player's group-volume
synchronization: changing volume applies the same percentage to every configured
member of the active group. When a Home player is standalone, synchronization is
disabled so its volume still works. State-switch keeps the solo and grouped player
instances mounted and selects between them only when grouping changes. Track and
artwork updates reach the existing player without rebuilding it. The porch Home
player reserves its height independently of artwork loading. This is separate from
the one-time equalization performed when selecting Main Floor. No new backend
automation is involved.

The rows use the installed layout-card, config-template-card, button-card, and
card-mod packages. There is no new custom JavaScript module or embedded webpage.
`templates/music.yaml` supplies three row sensors and one search-results sensor. Each row fetches
independently at startup, every ten minutes, when templates are reloaded, or when
`script.music_refresh_library` fires `music_library_refresh`. Playlist/album data
comes from the official Music Assistant integration. Recommendations use the
manually installed Music Assistant Queue Actions backend (`custom_components/mass_queue/`).

Restart Home Assistant to load the new template sensors and scripts. Queue Actions
must also be added/configured under Settings > Devices & services with
`http://nas.local:8095/`. Installing its files alone does not activate it.
If recommendations cannot load, that row shows a message; playlist/album data
requests run independently. After completing setup, use Refresh music. The sensors
cache up to eighteen items per row, preserve recommendation order, deduplicate
recommendation URIs, and exclude individual recommendation tracks. A fresh
installation does not have cached row data until the first successful request.

`input_select.music_destination` stores the selected destination for the Music
tab. `script.music_switch_destination` moves a playing queue, pauses members left
behind, and prepares Main Floor (Living Room, Office, Dining Room, Three Season
Porch), Bedroom, Basement, or Record Player. Roam is excluded. Selecting Main Floor sets all four individual speaker volumes to a fixed 20%. Other destinations keep their volumes;
The helper updates
only after successful commands. The script resolves the active queue owner from
Music Assistant player IDs and delegates the handoff to the native transfer action
before adjusting unwanted members and forming the selected destination group. A partial service failure can leave a partially
changed group; inspect the script trace. With multiple independent queues playing,
the previous selected destination is preferred as source, otherwise the first
playing configured room is used.

Data templates and row-card expressions have offline checks. A live destination
script test transferred the current track to Bedroom only; a subsequent read
confirmed all four Main Floor speakers playing and Bedroom idle. Data requests
and tablet rendering need separate verification. Home views retain their Mini Media Player controls; tapping
artwork/name opens Music in the same dashboard. Other Home controls and weather
are unchanged. Unused Sonos Card and experimental Music Assistant Player Card files
have been removed; neither card is loaded by these views.

## Key Files

| File | Purpose |
|---|---|
| `configuration.yaml` | Main config — helpers, Lovelace resources & dashboards |
| `automations.yaml` | All automations |
| `lights.yaml` | Light groups (living room, kitchen cabinets) |
| `groups.yaml` | Entity groups (outdoor lights) |
| `scripts.yaml` | Scripts |
| `scenes.yaml` | Scenes |
| `dashboards/` | Lovelace YAML dashboards |
| `custom_components/` | Custom integrations (including Omlet Smart Coop and Music Assistant Queue Actions) |

## Custom Integrations

- **Omlet Smart Coop** — controls the chicken coop door and feeder, exposes battery levels and last open/close timestamps

- **Music Assistant Queue Actions** — supplies Apple Music recommendations for the shared Music tabs

Music Assistant runs separately on the NAS and connects through the official Home Assistant integration. The native Home Assistant Sonos integration is no longer required by this setup.

## Secrets

Sensitive values (IPs, API keys) are stored in `secrets.yaml` (not committed).

## Configuration checks

GitHub Actions runs YAML lint once in `yamllint.yaml` and validates the Home
Assistant configuration in `ha-config-check.yaml`, using the version in
`.HA_VERSION`. No placeholder secrets are needed by the current YAML configuration.
The State Bonding blueprint used by the lighting automations is included in
`blueprints/automation/chrissalter/` so a fresh checkout has that dependency.
