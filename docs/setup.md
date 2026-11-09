# Setup and restore

See the [README](../README.md) for dashboard usage and the
[development guide](development.md) for applying configuration changes.

## Restoring an existing installation

Restore the full Home Assistant configuration volume. Git does not contain
integration credentials, device registrations, downloaded integrations/cards,
or most photos and styles. Keep backing up the full volume after setup.

## Starting a new installation

Use `.HA_VERSION` as the tested Home Assistant version. Copy the configuration
into HA’s configuration directory, then configure the integrations below and
replace the existing device references before enabling automations. Copying the
YAML does not connect devices or make its entity IDs match your installation.

### Music Assistant

1. Run Music Assistant and choose an address HA and dashboard browsers can reach.
   For a separate server, use its hostname or IP and configured port (normally
   8095). Open that address to confirm the server is accessible.
2. In Music Assistant, configure your music providers and players. Confirm you
   can browse music and play it on a speaker before connecting the dashboard.
3. In HA, open **Settings → Devices & services → Add integration**, select
   **Music Assistant**, and enter that server address when prompted.
4. For the Apple Music recommendation row, install
   [Music Assistant Queue Actions](https://github.com/droans/mass_queue), then add
   it in **Settings → Devices & services** using the same server address. Installing
   its files alone does not configure it. Search, playlists, and albums use the
   official integration; this recommendation row specifically requests Apple Music.
5. Map your players and integration IDs using the checklist below. Then open
   Music and use **Refresh music** to populate the rows.

The native HA Sonos integration is not required for these music controls when
Sonos players are provided through Music Assistant.

### Device and integration mapping

Find HA entity IDs in **Developer Tools → States**. Areas are managed in
**Settings → Areas, labels & zones**. Use the actual IDs rather than display names.

| Configuration | What to replace or configure |
|---|---|
| `configuration.yaml` | Destination names in `input_select.music_destination` |
| `scripts.yaml` | Both `destinations` maps, the destination selector, and the `queue_entities` player-ID map; choose group starting volumes here |
| `templates/music.yaml` | Music Assistant `config_entry_id` values, the Queue Actions ID in `config_entry_attr(...)`, recommendation player, and provider filter |
| `dashboards/shared/music.yaml` | Destination buttons, playback states, player entities, and the hotkey card’s destination map |
| Other files in `dashboards/shared/` | Device entities, room photos, and player/group references |
| `automations.yaml`, `scripts.yaml`, `templates/chicken-alerts.yaml` | Device entities, area targets, notification actions, and schedules |
| `lights.yaml`, `groups.yaml`, `scenes.yaml` | Group members and scene targets |

For an integration’s config-entry ID, go to **Settings → Devices & services**,
open the integration entry’s menu, and use **Copy entry ID** where available.
The `config_entry_id` fields in music actions need the official Music Assistant
entry; the recommendation startup check needs the separate Queue Actions entry.

The script’s `queue_entities` keys are Music Assistant player/queue identifiers,
not HA entity IDs. Match them to the `active_queue` attribute reported by your
Music Assistant player entities in **Developer Tools → States**.
Keep destination names consistent across the helper, scripts, and dashboard.
The keyboard module’s dashboard prefix must also match if you rename the dashboard.

### Other dependencies

Install and configure the integrations for the devices you keep:

- [Omlet Smart Coop](https://github.com/krozgrov/ha-omlet-integration) for coop doors and feeders.
- [Meross LAN](https://github.com/krahabb/meross_lan) for the outlet controls.
- The integrations providing your lights, fans, weather, and notification targets.

Install these frontend cards: Card Mod, Layout Card, Clock Weather Card,
Button Card, Mini Media Player, State Switch, and Config Template Card.
Check that their installed paths match `lovelace.resources` in `configuration.yaml`.

Restore or supply room photos and styles under `www/`, updating dashboard paths
as needed. The keyboard module at `www/dashboard/music-hotkeys.js` and the State
Bonding blueprint under `blueprints/automation/chrissalter/` are included in Git.

Keep credentials in HA’s integration settings or the untracked `secrets.yaml`.
Check the configuration, restart HA to load the integrations and dashboard, then
verify playback, controls, and notification targets before enabling automations.
